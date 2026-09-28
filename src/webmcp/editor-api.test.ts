import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { history, undo } from "@codemirror/commands";
import { store } from "../store";
import { openEditors } from "../components/editor/editor";
import { createEditorApi } from "./editor-api";
import { createTools, WebMcpTool } from "./tools";
import { saveDocumentValue } from "../components/projects/actions";

vi.mock("@csound/browser", () => ({ Csound: vi.fn(), libcsound: vi.fn() }));
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
