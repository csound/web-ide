import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { history, undo } from "@codemirror/commands";
import { store } from "../store";
import { openEditors } from "../components/editor/editor";
import { createEditorApi } from "./editor-api";
import { createTools, WebMcpTool } from "./tools";
import { saveDocumentValue } from "../components/projects/actions";
import { getLiveCsound } from "../components/csound/actions";
import { evalBlinkExtension } from "../components/editor/utils";
import { csoundEditorLanguage } from "../components/editor/csound-language";
import { clojureEditorLanguage } from "../components/editor/clojure-language";
import {
    splitActivePanel,
    toggleMaximizePanel
} from "../components/project-editor/actions";

vi.mock("@csound/browser", () => ({ Csound: vi.fn(), libcsound: vi.fn() }));
vi.mock("../components/csound/actions", async (importOriginal) => ({
    ...(await importOriginal<object>()),
    getLiveCsound: vi.fn()
}));
vi.mock("../components/projects/actions", async (importOriginal) => ({
    ...(await importOriginal<object>()),
    saveDocumentValue: vi.fn()
}));

let tools: WebMcpTool[];
let controller: AbortController;
const call = (name: string, input = {}) =>
    tools.find((tool) => tool.name === `csound_${name}`)!.execute(input);
const update = (source: string) =>
    store.dispatch({
        type: "PROJECTS.DOCUMENT_UPDATE_VALUE",
        val: source,
        projectUid: "test",
        documentUid: "csd"
    });

beforeEach(() => {
    // JSDOM has no text layout. The native browser check covers scrolling.
    vi.spyOn(EditorView.prototype, "requestMeasure").mockImplementation(
        () => {}
    );
    controller = new AbortController();
    store.dispatch({ type: "LOGIN.SIGNIN_SUCCESS", user: { uid: "visitor" } });
    store.dispatch({ type: "PROJECTS.UNSET_PROJECT", projectUid: "test" });
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [
            {
                projectUid: "test",
                userUid: "owner",
                name: "Test",
                documents: {
                    csd: {
                        documentUid: "csd",
                        filename: "project.csd",
                        type: "txt",
                        path: [],
                        currentValue: "instr 1\nendin",
                        savedValue: "instr 1\nendin",
                        isModifiedLocally: false
                    },
                    orc: {
                        documentUid: "orc",
                        filename: "voice.orc",
                        type: "txt",
                        path: [],
                        currentValue: "instr 2\nendin",
                        savedValue: "instr 2\nendin",
                        isModifiedLocally: false
                    },
                    bin: {
                        documentUid: "bin",
                        filename: "sound.wav",
                        type: "bin",
                        path: []
                    }
                }
            }
        ]
    });
    store.dispatch({ type: "PROJECTS.ACTIVATE_PROJECT", projectUid: "test" });
    store.dispatch({
        type: "PROJECT_EDITOR.TAB_DOCK_INIT",
        initialOpenDocuments: [{ uid: "csd" }, { uid: "orc" }],
        initialIndex: 0
    });
    tools = createTools(
        createEditorApi(
            "test",
            () => ["compile failed\n"],
            vi.fn(),
            controller.signal
        )
    );
});

afterEach(() => {
    controller.abort();
    for (const editor of openEditors.values()) editor.destroy();
    openEditors.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.mocked(getLiveCsound).mockReset();
    vi.useRealTimers();
});

function interactiveEditor(source = "instr 1\nendin", fileType = "orc") {
    update(source);
    const view = new EditorView({
        state: EditorState.create({
            doc: source,
            extensions: [
                history(),
                evalBlinkExtension,
                fileType === "lisp"
                    ? clojureEditorLanguage()
                    : csoundEditorLanguage(fileType)
            ]
        }),
        parent: document.body
    });
    openEditors.set("csd", view);
    return view;
}

describe("live editor tools", () => {
    it.each(["voice.mal", "voice.clj"])(
        "evaluates and blinks a Lisp region in %s",
        async (filename) => {
            store.dispatch({
                type: "PROJECTS.DOCUMENT_RENAME_LOCALLY",
                projectUid: "test",
                documentUid: "csd",
                newFilename: filename
            });
            const source = "(def notes [60 64 67])";
            const view = interactiveEditor(source, "lisp");
            const engine = {
                evalCode: vi.fn().mockResolvedValue(1),
                setStringChannel: vi.fn().mockResolvedValue(undefined)
            };
            vi.mocked(getLiveCsound).mockReturnValue(engine as any);
            const before = await call("read_document", { document_id: "csd" });
            expect(
                await call("evaluate_region", {
                    document_id: "csd",
                    base_revision: before.revision,
                    from: 0,
                    to: source.length
                })
            ).toMatchObject({ ok: true, evaluated: true });
            expect(engine.setStringChannel).toHaveBeenCalledWith(
                "__web_ide_lisp_source",
                source
            );
            expect(view.state.field(evalBlinkExtension).size).toBe(1);
        }
    );
    it.each(["open_document", "set_selection"])(
        "%s focuses an existing tab in another panel without duplicating it when leaving focus mode",
        async (tool) => {
            const view = interactiveEditor();
            store.dispatch(splitActivePanel("right"));
            const splitLayout = store.getState().ProjectEditorReducer;
            const targetPanelId = splitLayout.activePanelId;
            store.dispatch(toggleMaximizePanel("panel-1"));
            const before = await call("read_document", { document_id: "csd" });

            const result = await call(tool, {
                document_id: "csd",
                ...(tool === "set_selection"
                    ? { base_revision: before.revision, anchor: 7 }
                    : {})
            });

            expect(result).toMatchObject({ ok: true });
            const layout = store.getState().ProjectEditorReducer;
            expect(layout.maximizedPanelId).toBeNull();
            expect(layout.activePanelId).toBe(targetPanelId);
            expect(layout.root).toEqual(splitLayout.root);
            if (tool === "set_selection") {
                expect(view.hasFocus).toBe(true);
                expect(view.state.selection.main.anchor).toBe(7);
            }
        }
    );

    it.each([false, true])(
        "waits for a closed editor to mount and rechecks its revision (changed=%s)",
        async (changed) => {
            const before = await call("read_document", { document_id: "csd" });
            vi.useFakeTimers();
            const selection = call("set_selection", {
                document_id: "csd",
                base_revision: before.revision,
                anchor: 0
            });
            await vi.advanceTimersByTimeAsync(0);
            const view = interactiveEditor(
                changed ? "a newer edit" : before.source
            );
            await vi.advanceTimersByTimeAsync(16);
            expect(await selection).toMatchObject(
                changed
                    ? { ok: false, error: { code: "stale_revision" } }
                    : { ok: true }
            );
            expect(view.state.doc.toString()).toBe(
                changed ? "a newer edit" : before.source
            );
        }
    );

    it.each(["edit", "close"])(
        "does not flash stale positions if the editor changes during evaluation: %s",
        async (change) => {
            const view = interactiveEditor();
            const before = await call("read_document", { document_id: "csd" });
            let finish!: (result: number) => void;
            const engine = {
                evalCode: vi.fn(
                    () =>
                        new Promise<number>((resolve) => {
                            finish = resolve;
                        })
                ),
                readScore: vi.fn()
            };
            vi.mocked(getLiveCsound).mockReturnValue(engine as any);
            const evaluation = call("evaluate_region", {
                document_id: "csd",
                base_revision: before.revision,
                from: 0,
                to: before.source.length
            });
            await vi.waitFor(() => expect(engine.evalCode).toHaveBeenCalled());
            if (change === "close") view.destroy();
            else
                view.dispatch({
                    changes: { from: 0, to: view.state.doc.length, insert: "" }
                });
            finish(0);
            expect(await evaluation).toMatchObject({ ok: true });
            expect(view.state.field(evalBlinkExtension).size).toBe(0);
        }
    );

    it("moves and selects the cursor, reveals an offset without moving it, and returns selection state", async () => {
        const view = interactiveEditor();
        const before = await call("read_document", { document_id: "csd" });
        const select = await call("set_selection", {
            document_id: "csd",
            base_revision: before.revision,
            anchor: 7,
            head: 0
        });
        expect(select).toMatchObject({
            ok: true,
            selection: { anchor: 7, head: 0 },
            revision: before.revision
        });
        expect(view.hasFocus).toBe(true);
        const scroll = vi.spyOn(EditorView, "scrollIntoView");
        expect(
            await call("scroll_to", {
                document_id: "csd",
                base_revision: before.revision,
                position: 8
            })
        ).toMatchObject({ ok: true, selection: { anchor: 7, head: 0 } });
        expect(scroll).toHaveBeenCalledWith(8, { y: "center" });
        scroll.mockRestore();
        expect(
            await call("set_selection", {
                document_id: "csd",
                base_revision: before.revision,
                anchor: 8
            })
        ).toMatchObject({ selection: { anchor: 8, head: 8 } });
    });

    it("types over a region in visible steps, preserves Unicode, and supports undo", async () => {
        const view = interactiveEditor("before");
        const before = await call("read_document", { document_id: "csd" });
        vi.useFakeTimers();
        const typing = call("type_text", {
            document_id: "csd",
            base_revision: before.revision,
            from: 0,
            to: 6,
            text: "a😀\r\nb",
            delay_ms: 25
        });
        await vi.advanceTimersByTimeAsync(0);
        expect(view.state.doc.toString()).toBe("a");
        await vi.advanceTimersByTimeAsync(25);
        expect(view.state.doc.toString()).toBe("a😀");
        expect(view.state.selection.main.head).toBe(3);
        await vi.advanceTimersByTimeAsync(100);
        const result = await typing;
        expect(result).toMatchObject({
            ok: true,
            source: "a😀\nb",
            modified: true
        });
        expect(result.revision).not.toBe(before.revision);
        expect(
            store.getState().ProjectsReducer.projects.test.documents.csd
                .currentValue
        ).toBe("a😀\nb");
        expect(saveDocumentValue).not.toHaveBeenCalled();
        expect(undo(view)).toBe(true);
        expect(view.state.doc.toString()).toBe("before");
    });

    it.each(["edit", "cursor", "close", "project", "cancel", "tab"])(
        "stops paced typing after %s without undoing applied text",
        async (reason) => {
            const view = interactiveEditor("");
            const before = await call("read_document", { document_id: "csd" });
            const abort = new AbortController();
            vi.useFakeTimers();
            const typing = tools
                .find((t) => t.name === "csound_type_text")!
                .execute(
                    {
                        document_id: "csd",
                        base_revision: before.revision,
                        from: 0,
                        to: 0,
                        text: "abc",
                        delay_ms: 25
                    },
                    { signal: abort.signal }
                );
            await vi.advanceTimersByTimeAsync(0);
            expect(view.state.doc.toString()).toBe("a");
            if (reason === "edit")
                view.dispatch({ changes: { from: 1, insert: "human" } });
            if (reason === "cursor")
                view.dispatch({ selection: { anchor: 0 } });
            if (reason === "close") view.destroy();
            if (reason === "project") controller.abort();
            if (reason === "cancel") abort.abort();
            if (reason === "tab")
                store.dispatch({
                    type: "PROJECT_EDITOR.TAB_DOCK_INIT",
                    initialOpenDocuments: [{ uid: "orc" }],
                    initialIndex: 0
                });
            await vi.advanceTimersByTimeAsync(100);
            expect(await typing).toMatchObject({ ok: false });
            expect(view.state.doc.toString()).toBe(
                reason === "edit" ? "ahuman" : "a"
            );
            expect(saveDocumentValue).not.toHaveBeenCalled();
        }
    );

    it("rejects concurrent typing and stale or invalid offsets before editing", async () => {
        const view = interactiveEditor("😀");
        const before = await call("read_document", { document_id: "csd" });
        for (const anchor of [1, 3, -1, 0.5]) {
            expect(
                await call("set_selection", {
                    document_id: "csd",
                    base_revision: before.revision,
                    anchor
                })
            ).toMatchObject({ ok: false });
        }
        expect(
            await call("type_text", {
                document_id: "csd",
                base_revision: before.revision,
                from: 2,
                to: 0,
                text: "x"
            })
        ).toMatchObject({ error: { code: "invalid_range" } });
        expect(
            await call("type_text", {
                document_id: "csd",
                base_revision: before.revision,
                from: 0,
                to: 0,
                text: "x".repeat(1000),
                delay_ms: 200
            })
        ).toMatchObject({ error: { code: "invalid_input" } });
        vi.useFakeTimers();
        const typing = call("type_text", {
            document_id: "csd",
            base_revision: before.revision,
            from: 0,
            to: 0,
            text: "abc",
            delay_ms: 25
        });
        await vi.advanceTimersByTimeAsync(0);
        const current = await call("read_document", { document_id: "csd" });
        expect(
            await call("type_text", {
                document_id: "csd",
                base_revision: current.revision,
                from: 0,
                to: 0,
                text: "x"
            })
        ).toMatchObject({ error: { code: "busy" } });
        expect(
            await call("set_selection", {
                document_id: "csd",
                base_revision: before.revision,
                anchor: 0
            })
        ).toMatchObject({ error: { code: "stale_revision" } });
        await vi.advanceTimersByTimeAsync(100);
        expect(await typing).toMatchObject({ ok: true });
        expect(view.state.doc.toString()).toBe("abc😀");
    });

    it("waits for evaluation, selects and flashes the region, and reports engine errors", async () => {
        const view = interactiveEditor();
        const before = await call("read_document", { document_id: "csd" });
        const input = {
            document_id: "csd",
            base_revision: before.revision,
            from: 0,
            to: 13
        };
        expect(await call("evaluate_region", input)).toMatchObject({
            error: { code: "invalid_state" }
        });
        let finish!: (code: number) => void;
        const engine = {
            evalCode: vi.fn(
                () =>
                    new Promise<number>((resolve) => {
                        finish = resolve;
                    })
            ),
            readScore: vi.fn()
        };
        vi.mocked(getLiveCsound).mockReturnValue(engine as any);
        const evaluation = call("evaluate_region", input);
        await vi.waitFor(() =>
            expect(engine.evalCode).toHaveBeenCalledWith("instr 1\nendin")
        );
        expect(view.state.selection.main.to).toBe(13);
        finish(0);
        expect(await evaluation).toMatchObject({ ok: true, evaluated: true });
        expect(view.state.field(evalBlinkExtension).size).toBe(1);
        engine.evalCode.mockResolvedValueOnce(1);
        expect(await call("evaluate_region", input)).toMatchObject({
            error: { code: "evaluation_failed" }
        });
    });

    it("sends a selected CSD score region to readScore", async () => {
        const source =
            "<CsoundSynthesizer>\n<CsScore>\ni 1 0 1\n</CsScore>\n</CsoundSynthesizer>";
        interactiveEditor(source, "csd");
        const engine = {
            evalCode: vi.fn(),
            readScore: vi.fn().mockResolvedValue(0)
        };
        vi.mocked(getLiveCsound).mockReturnValue(engine as any);
        const before = await call("read_document", { document_id: "csd" });
        const from = source.indexOf("i 1");
        expect(
            await call("evaluate_region", {
                document_id: "csd",
                base_revision: before.revision,
                from,
                to: from + 7
            })
        ).toMatchObject({ ok: true });
        expect(engine.readScore).toHaveBeenCalledWith("i 1 0 1");
        expect(engine.evalCode).not.toHaveBeenCalled();
    });
});

describe("editor tools", () => {
    it("rejects a stale revision after a human edit without losing that edit", async () => {
        const before = await call("read_document", { document_id: "csd" });
        update("human edit");
        expect(
            await call("update_document", {
                document_id: "csd",
                base_revision: before.revision,
                source: "agent edit"
            })
        ).toMatchObject({ ok: false, error: { code: "stale_revision" } });
        expect(
            store.getState().ProjectsReducer.projects.test.documents.csd
                .currentValue
        ).toBe("human edit");
    });

    it("updates closed files locally and rejects ambiguous replacements", async () => {
        const before = await call("read_document", { document_id: "csd" });
        const after = await call("replace_text", {
            document_id: "csd",
            base_revision: before.revision,
            old_text: "instr 1",
            new_text: "instr 2"
        });
        expect(after).toMatchObject({
            ok: true,
            source: "instr 2\nendin",
            modified: true
        });
        expect(saveDocumentValue).not.toHaveBeenCalled();
        expect(
            await call("replace_text", {
                document_id: "csd",
                base_revision: after.revision,
                old_text: "in",
                new_text: "xx"
            })
        ).toMatchObject({ ok: false, error: { code: "ambiguous_match" } });
    });

    it("keeps open CodeMirror content and undo history in sync", async () => {
        const editor = new EditorView({
            state: EditorState.create({
                doc: "instr 1\nendin",
                extensions: [
                    history(),
                    EditorView.updateListener.of((view) => {
                        if (view.docChanged) update(view.state.doc.toString());
                    })
                ]
            })
        });
        openEditors.set("csd", editor);
        const before = await call("read_document", { document_id: "csd" });
        const after = await call("replace_text", {
            document_id: "csd",
            base_revision: before.revision,
            old_text: "instr 1",
            new_text: "instr 3"
        });
        expect(after.ok).toBe(true);
        expect(editor.state.doc.toString()).toBe("instr 3\nendin");
        expect(undo(editor)).toBe(true);
        expect(
            (await call("read_document", { document_id: "csd" })).source
        ).toBe("instr 1\nendin");
    });

    it("selects tabs using stable IDs and refuses to close unsaved work", async () => {
        const state = await call("read_workspace");
        const panel = (state.panels as any[]).find(
            (panel) => panel.panel_id === "panel-1"
        );
        expect(
            (
                await call("select_tab", {
                    panel_id: panel.panel_id,
                    tab_id: panel.tabs[1].tab_id
                })
            ).ok
        ).toBe(true);
        expect(store.getState().ProjectEditorReducer.tabDock.tabIndex).toBe(1);
        update("unsaved");
        expect(
            await call("close_tab", {
                panel_id: panel.panel_id,
                tab_id: panel.tabs[0].tab_id
            })
        ).toMatchObject({ ok: false, error: { code: "unsaved_changes" } });
    });

    it("enforces project scope, text types, and save ownership", async () => {
        expect(
            await call("read_document", { document_id: "other-project-doc" })
        ).toMatchObject({ ok: false, error: { code: "document_not_found" } });
        expect(
            await call("read_document", { document_id: "bin" })
        ).toMatchObject({ ok: false, error: { code: "not_text" } });
        const current = await call("read_document", { document_id: "csd" });
        expect(
            await call("save_document", {
                document_id: "csd",
                base_revision: current.revision
            })
        ).toMatchObject({ ok: false, error: { code: "permission_denied" } });
        expect(saveDocumentValue).not.toHaveBeenCalled();
        controller.abort();
        expect(await call("read_workspace")).toMatchObject({
            ok: false,
            error: { code: "project_changed" }
        });
    });

    it("checks signed-in ownership and awaits saves, including errors", async () => {
        store.dispatch({
            type: "LOGIN.SIGNIN_SUCCESS",
            user: { uid: "owner" }
        });
        const current = await call("read_document", { document_id: "csd" });
        let finish!: () => void;
        vi.mocked(saveDocumentValue).mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    finish = resolve;
                })
        );
        let completed = false;
        const saved = call("save_document", {
            document_id: "csd",
            base_revision: current.revision
        }).then((result) => {
            completed = true;
            return result;
        });
        await Promise.resolve();
        expect(completed).toBe(false);
        finish();
        expect(await saved).toMatchObject({ ok: true, saved: true });
        vi.mocked(saveDocumentValue).mockRejectedValueOnce(
            new Error("Cloud unavailable")
        );
        expect(
            await call("save_document", {
                document_id: "csd",
                base_revision: current.revision
            })
        ).toMatchObject({ ok: false, error: { message: "Cloud unavailable" } });
        store.dispatch({ type: "LOGIN.LOG_OUT" });
        expect(
            await call("save_document", {
                document_id: "csd",
                base_revision: current.revision
            })
        ).toMatchObject({ ok: false, error: { code: "permission_denied" } });
    });

    it("preserves a newer edit when a cloud save acknowledgement arrives", async () => {
        const saved =
            store.getState().ProjectsReducer.projects.test.documents.csd;
        update("newer edit");
        store.dispatch({
            type: "PROJECTS.DOCUMENT_SAVE",
            projectUid: "test",
            document: {
                ...saved,
                currentValue: "saved earlier",
                savedValue: "saved earlier"
            }
        });
        expect(
            await call("read_document", { document_id: "csd" })
        ).toMatchObject({ source: "newer edit", modified: true });
    });

    it("selects playlist entries and rejects unknown targets and indexes", async () => {
        store.dispatch({
            type: "TARGET_CONTROL.UPDATE_ALL_TARGETS_LOCALLY",
            projectUid: "test",
            defaultTarget: "playlist",
            targets: {
                playlist: {
                    targetName: "playlist",
                    targetType: "playlist",
                    playlistDocumentsUid: ["csd", "orc"]
                }
            }
        });
        expect(
            await call("select_target", {
                target_name: "playlist",
                playlist_index: 1
            })
        ).toMatchObject({
            ok: true,
            selected_target: "playlist",
            selected_playlist_index: 1
        });
        expect(
            await call("select_target", { target_name: "missing" })
        ).toMatchObject({ ok: false, error: { code: "target_not_found" } });
        expect(
            await call("select_target", {
                target_name: "playlist",
                playlist_index: 2
            })
        ).toMatchObject({ ok: false, error: { code: "invalid_target" } });
    });

    it("returns bounded console output and the discoverable guide", async () => {
        expect(await call("read_console", { limit: 1 })).toMatchObject({
            ok: true,
            text: "compile failed\n"
        });
        expect(await call("read_guide")).toMatchObject({
            ok: true,
            documentation_url: "/documentation#webmcp"
        });
    });
});
