import { store } from "@root/store";
import { openEditors } from "@comp/editor/editor";
import { EditorView } from "@codemirror/view";
import {
    evaluateEditorRegion,
    findSurroundingContext
} from "@comp/editor/utils";
import { updateDocumentValue, saveDocumentValue } from "@comp/projects/actions";
import { selectIsOwner } from "@comp/project-editor/selectors";
import {
    tabOpenByDocumentUid,
    switchPanelTab,
    setActivePanel,
    setSidebarTabIndex,
    closePanelTab,
    closeSidebarTab,
    toggleMaximizePanel
} from "@comp/project-editor/actions";
import {
    IWorkspaceLayoutNode,
    IWorkspacePanelNode
} from "@comp/project-editor/types";
import {
    documentPath,
    runPerformance,
    stopPerformance,
    pauseCsound,
    resumePausedCsound,
    isCsoundBusy,
    getLiveCsound
} from "@comp/csound/actions";
import { nonCloudFiles } from "@comp/file-tree/actions";
import { SET_SELECTED_TARGET } from "@comp/target-controls/types";
import { getSelectedTargetDocumentUid } from "@comp/target-controls/selectors";
import {
    guide,
    MAX_SOURCE_LENGTH,
    MAX_TYPING_DURATION_MS,
    ToolError,
    ToolExecutor
} from "./tools";
import {
    checkPosition,
    typeIntoEditor,
    waitForEditorStep
} from "./interactions";

const panelsIn = (node: IWorkspaceLayoutNode): IWorkspacePanelNode[] =>
    node.kind === "panel"
        ? [node]
        : [...panelsIn(node.first), ...panelsIn(node.second)];

export function createEditorApi(
    projectUid: string,
    getConsole: () => string[],
    setConsole: React.Dispatch<React.SetStateAction<string[]>>,
    lifetime: AbortSignal
): ToolExecutor {
    const revisions = new Map<string, { source: string; revision: string }>();
    const session = crypto.randomUUID();
    let nextRevision = 0;
    const canSave = () =>
        store.getState().LoginReducer.authenticated &&
        selectIsOwner(store.getState());
    const project = () => {
        const state = store.getState();
        if (
            lifetime.aborted ||
            state.ProjectsReducer.activeProjectUid !== projectUid ||
            !state.ProjectsReducer.projects[projectUid]
        ) {
            throw new ToolError(
                "project_changed",
                "Open the project and discover its tools again."
            );
        }
        return state.ProjectsReducer.projects[projectUid];
    };
    const document = (id: string, textOnly = true) => {
        const file = project().documents[id];
        if (!file)
            throw new ToolError(
                "document_not_found",
                "Read workspace and use a document_id from its files."
            );
        if (textOnly && file.type !== "txt")
            throw new ToolError(
                "not_text",
                "This tool accepts text files only."
            );
        return file;
    };
    const read = (id: string) => {
        const file = document(id);
        const source =
            openEditors.get(id)?.state.doc.toString() ?? file.currentValue;
        if (source.length > MAX_SOURCE_LENGTH)
            throw new ToolError(
                "document_too_large",
                `This document exceeds ${MAX_SOURCE_LENGTH} characters.`
            );
        let current = revisions.get(id);
        if (!current || current.source !== source) {
            current = { source, revision: `${session}:${++nextRevision}` };
            revisions.set(id, current);
        }
        return {
            document_id: id,
            filename: file.filename,
            ...current,
            modified: file.isModifiedLocally,
            selection: openEditors.get(id)?.state.selection.main.toJSON(),
            visible_ranges: openEditors
                .get(id)
                ?.visibleRanges.map(({ from, to }) => ({ from, to }))
        };
    };
    const checkedRead = (id: string, baseRevision: string) => {
        const current = read(id);
        if (current.revision !== baseRevision)
            throw new ToolError(
                "stale_revision",
                "The source changed. Read the document again before editing or saving."
            );
        return current;
    };
    const openDocument = async (id: string) => {
        const file = document(id, false);
        if (file.type === "folder")
            throw new ToolError("not_file", "Choose a file, not a folder.");
        const layout = store.getState().ProjectEditorReducer;
        const existing = panelsIn(layout.root).find((panel) =>
            panel.tabs.some((tab) => tab.type === "editor" && tab.uid === id)
        );
        if (existing) store.dispatch(setActivePanel(existing.id));
        if (
            layout.maximizedPanelId &&
            existing &&
            layout.maximizedPanelId !== existing.id
        )
            store.dispatch(toggleMaximizePanel(layout.maximizedPanelId));
        await store.dispatch(tabOpenByDocumentUid(id, projectUid));
    };
    const isActiveEditor = (id: string) => {
        const layout = store.getState().ProjectEditorReducer;
        const panel = panelsIn(layout.root).find(
            (item) => item.id === layout.activePanelId
        );
        const tab = panel?.tabs[panel.tabIndex];
        return tab?.type === "editor" && tab.uid === id;
    };
    const revealEditor = async (
        id: string,
        revision: string,
        signal: AbortSignal
    ) => {
        checkedRead(id, revision);
        await openDocument(id);
        for (let attempt = 0; attempt < 125; attempt++) {
            project();
            signal.throwIfAborted();
            if (!isActiveEditor(id))
                throw new ToolError(
                    "editor_changed",
                    "The active tab changed. Read workspace again."
                );
            const view = openEditors.get(id);
            if (view && view.dom.isConnected) {
                checkedRead(id, revision);
                view.focus();
                return view;
            }
            await waitForEditorStep(16, signal);
        }
        throw new ToolError(
            "editor_unavailable",
            "The text editor did not mount. Open the document and retry."
        );
    };
    const workspace = () => {
        const currentProject = project();
        const state = store.getState();
        const layout = state.ProjectEditorReducer;
        const targets = state.TargetControlsReducer[projectUid];
        return {
            project: {
                id: projectUid,
                name: currentProject.name,
                can_save: canSave(),
                is_public: currentProject.isPublic
            },
            files: Object.values(currentProject.documents).map((file) => ({
                document_id: file.documentUid,
                path: documentPath(file, currentProject.documents),
                type: file.type,
                modified: file.isModifiedLocally
            })),
            panels: [
                ...panelsIn(layout.root),
                ...[
                    layout.leftSidebar,
                    layout.rightSidebar,
                    layout.bottomSidebar
                ].filter((panel): panel is IWorkspacePanelNode => !!panel)
            ].map((panel) => ({
                panel_id: panel.id,
                active: panel.id === layout.activePanelId,
                tabs: panel.tabs.map((tab, index) => ({
                    tab_id: tab.id,
                    type: tab.type,
                    document_id: tab.type === "editor" ? tab.uid : undefined,
                    active: index === panel.tabIndex
                }))
            })),
            targets: Object.values(targets?.targets ?? {}),
            selected_target: targets?.selectedTarget ?? null,
            selected_playlist_index: targets?.selectedTargetPlaylistIndex ?? 0,
            audio: { status: state.csound.status, busy: isCsoundBusy() },
            rendered_files: [...nonCloudFiles.values()].map((file) => ({
                name: file.name,
                bytes: file.buffer?.length ?? 0
            })),
            documentation_url: guide.documentation_url,
            next_step:
                "Read a document before editing. Use read_guide for the full tool catalog."
        };
    };
    const getTarget = (id?: string) => {
        project();
        const targetId =
            id ?? getSelectedTargetDocumentUid(projectUid)(store.getState());
        if (!targetId)
            throw new ToolError(
                "no_target",
                "Select a target or pass a CSD/ORC document_id."
            );
        const file = document(targetId);
        if (!/\.(csd|orc)$/i.test(file.filename))
            throw new ToolError("invalid_target", "Choose a CSD or ORC file.");
        return file;
    };
    return async (name, input, signal) => {
        project();
        signal?.throwIfAborted();
        const id = input.document_id as string;
        switch (name) {
            case "csound_read_workspace":
                return workspace();
            case "csound_read_guide":
                return guide;
            case "csound_read_document":
                return read(id);
            case "csound_set_selection":
            case "csound_scroll_to":
            case "csound_type_text":
            case "csound_evaluate_region": {
                const before = checkedRead(id, input.base_revision as string);
                const from = (input.from ??
                    input.anchor ??
                    input.position) as number;
                const to = (input.to ?? input.head ?? from) as number;
                checkPosition(before.source, from);
                checkPosition(before.source, to);
                const isRegion =
                    name === "csound_type_text" ||
                    name === "csound_evaluate_region";
                if (isRegion && to < from)
                    throw new ToolError(
                        "invalid_range",
                        "The range must have from <= to; to is exclusive."
                    );
                const text =
                    (input.text as string | undefined)?.replace(
                        /\r\n?/g,
                        "\n"
                    ) ?? "";
                const delay = (input.delay_ms as number | undefined) ?? 25;
                if (name === "csound_type_text") {
                    if (
                        before.source.length - (to - from) + text.length >
                        MAX_SOURCE_LENGTH
                    )
                        throw new ToolError(
                            "document_too_large",
                            "Typing would exceed the source limit."
                        );
                    if (
                        Array.from(text).length * delay >
                        MAX_TYPING_DURATION_MS
                    )
                        throw new ToolError(
                            "invalid_input",
                            "Reduce text or delay_ms to keep typing within 120 seconds."
                        );
                }
                let csound = getLiveCsound(projectUid);
                const fileType = document(id)
                    .filename.split(".")
                    .pop()
                    ?.toLowerCase();
                if (name === "csound_evaluate_region") {
                    if (!csound)
                        throw new ToolError(
                            "invalid_state",
                            "Start realtime playback for this project before evaluating a region."
                        );
                    if (
                        !fileType ||
                        !["csd", "orc", "udo", "sco"].includes(fileType)
                    )
                        throw new ToolError(
                            "invalid_target",
                            "Choose a CSD, ORC, UDO or SCO text file."
                        );
                    if (!before.source.slice(from, to).trim())
                        throw new ToolError(
                            "invalid_range",
                            "Select a nonempty code region."
                        );
                }
                const combined = AbortSignal.any([
                    lifetime,
                    ...(signal ? [signal] : [])
                ]);
                const view = await revealEditor(id, before.revision, combined);
                combined.throwIfAborted();
                checkedRead(id, before.revision);
                if (name === "csound_scroll_to") {
                    view.dispatch({
                        effects: EditorView.scrollIntoView(from, {
                            y: "center"
                        })
                    });
                } else if (name === "csound_type_text") {
                    await typeIntoEditor(view, {
                        from,
                        to,
                        text,
                        delay,
                        signal: combined,
                        check: () => {
                            project();
                            if (
                                openEditors.get(id) !== view ||
                                !isActiveEditor(id)
                            )
                                throw new ToolError(
                                    "editor_changed",
                                    "The editor closed or the active tab changed. Partial typing stays unsaved."
                                );
                        },
                        onChange: (source) =>
                            store.dispatch(
                                updateDocumentValue(source, projectUid, id)
                            )
                    });
                } else {
                    view.dispatch({
                        selection: { anchor: from, head: to },
                        scrollIntoView: true
                    });
                    if (name === "csound_evaluate_region") {
                        csound = getLiveCsound(projectUid);
                        if (!csound)
                            throw new ToolError(
                                "invalid_state",
                                "Realtime playback stopped before evaluation."
                            );
                        combined.throwIfAborted();
                        const firstCode =
                            from + before.source.slice(from, to).search(/\S/);
                        const kind = findSurroundingContext(
                            view.state,
                            firstCode
                        )?.kind;
                        const type =
                            fileType === "csd" && kind === "score-statement"
                                ? "sco"
                                : fileType!;
                        const result = await evaluateEditorRegion(
                            csound,
                            type,
                            view,
                            { from, to }
                        );
                        if (result !== 0)
                            throw new ToolError(
                                "evaluation_failed",
                                "Csound rejected the region. Read the console for details."
                            );
                        project();
                        combined.throwIfAborted();
                        return {
                            document_id: id,
                            evaluated: true,
                            from,
                            to,
                            result
                        };
                    }
                }
                return read(id);
            }
            case "csound_update_document":
            case "csound_replace_text": {
                const before = checkedRead(id, input.base_revision as string);
                let from = 0,
                    to = before.source.length;
                const insert = (
                    name === "csound_replace_text"
                        ? input.new_text
                        : input.source
                ) as string;
                if (name === "csound_replace_text") {
                    const old = input.old_text as string;
                    from = before.source.indexOf(old);
                    if (from < 0 || before.source.indexOf(old, from + 1) >= 0)
                        throw new ToolError(
                            "ambiguous_match",
                            "old_text must match exactly once. Read the document and include more context."
                        );
                    to = from + old.length;
                }
                const source =
                    before.source.slice(0, from) +
                    insert +
                    before.source.slice(to);
                if (source.length > MAX_SOURCE_LENGTH)
                    throw new ToolError(
                        "document_too_large",
                        "The edited document exceeds the source limit."
                    );
                const editor = openEditors.get(id);
                if (editor)
                    editor.dispatch({
                        changes: { from, to, insert },
                        userEvent: "input.webmcp"
                    });
                await store.dispatch(
                    updateDocumentValue(
                        editor?.state.doc.toString() ?? source,
                        projectUid,
                        id
                    )
                );
                return read(id);
            }
            case "csound_save_document": {
                const current = checkedRead(id, input.base_revision as string);
                if (!canSave())
                    throw new ToolError(
                        "permission_denied",
                        "Only the signed-in project owner can save. Local edits remain available."
                    );
                await saveDocumentValue(projectUid, id, current.source);
                return { document_id: id, saved: true };
            }
            case "csound_open_document": {
                await openDocument(id);
                return workspace();
            }
            case "csound_select_tab":
            case "csound_close_tab": {
                const layout = store.getState().ProjectEditorReducer;
                const sidebars = ["left", "right", "bottom"] as const;
                const sidebar = sidebars.find(
                    (side) => layout[`${side}Sidebar`]?.id === input.panel_id
                );
                const panel = sidebar
                    ? layout[`${sidebar}Sidebar`]
                    : panelsIn(layout.root).find(
                          (panel) => panel.id === input.panel_id
                      );
                const index =
                    panel?.tabs.findIndex((tab) => tab.id === input.tab_id) ??
                    -1;
                if (!panel || index < 0)
                    throw new ToolError(
                        "tab_not_found",
                        "Read workspace for current panel and tab IDs."
                    );
                const tab = panel.tabs[index];
                if (name === "csound_close_tab") {
                    if (
                        tab.type === "editor" &&
                        project().documents[tab.uid]?.isModifiedLocally
                    )
                        throw new ToolError(
                            "unsaved_changes",
                            "Save this document or keep its tab open."
                        );
                    store.dispatch(
                        sidebar
                            ? closeSidebarTab(sidebar, tab.id)
                            : closePanelTab(panel.id, tab.id)
                    );
                } else if (sidebar) {
                    store.dispatch(setSidebarTabIndex(sidebar, index));
                } else {
                    store.dispatch(setActivePanel(panel.id));
                    store.dispatch(switchPanelTab(panel.id, index));
                }
                return workspace();
            }
            case "csound_select_target": {
                const targets =
                    store.getState().TargetControlsReducer[projectUid];
                const target = targets?.targets[input.target_name as string];
                if (!target)
                    throw new ToolError(
                        "target_not_found",
                        "Read workspace for valid target names."
                    );
                const index = (input.playlist_index ?? 0) as number;
                if (
                    target.playlistDocumentsUid
                        ? !target.playlistDocumentsUid[index]
                        : input.playlist_index !== undefined
                )
                    throw new ToolError(
                        "invalid_target",
                        "Choose an existing playlist entry; omit playlist_index for a single-file target."
                    );
                store.dispatch({
                    type: SET_SELECTED_TARGET,
                    projectUid,
                    selectedTarget: {
                        ...targets,
                        selectedTarget: input.target_name,
                        selectedTargetPlaylistIndex: index
                    }
                });
                return workspace();
            }
            case "csound_play":
            case "csound_render": {
                if (isCsoundBusy())
                    throw new ToolError(
                        "busy",
                        "Stop Csound before starting another run."
                    );
                const target = getTarget(id);
                const combined = AbortSignal.any([
                    lifetime,
                    ...(signal ? [signal] : [])
                ]);
                return runPerformance({
                    projectUid,
                    csdPath: /\.csd$/i.test(target.filename)
                        ? documentPath(target, project().documents)
                        : undefined,
                    orc: target.currentValue,
                    mode: name === "csound_render" ? "render" : "play",
                    setConsole,
                    signal: combined
                });
            }
            case "csound_pause":
            case "csound_resume": {
                const status = store.getState().csound.status;
                if (!["playing", "paused"].includes(status))
                    throw new ToolError(
                        "invalid_state",
                        "No realtime playback is active."
                    );
                if (name === "csound_pause" && status === "playing")
                    store.dispatch(pauseCsound());
                if (name === "csound_resume" && status === "paused")
                    store.dispatch(resumePausedCsound());
                return { status: store.getState().csound.status };
            }
            case "csound_stop":
                await stopPerformance();
                return { status: store.getState().csound.status };
            case "csound_read_console": {
                const entries = getConsole();
                const text = entries
                    .slice(-((input.limit as number) ?? 100))
                    .join("");
                return {
                    text: text.slice(-32000),
                    truncated:
                        text.length > 32000 ||
                        entries.length > ((input.limit as number) ?? 100),
                    status: store.getState().csound.status
                };
            }
            default:
                throw new ToolError(
                    "unknown_tool",
                    "Discover the tool catalog again."
                );
        }
    };
}
