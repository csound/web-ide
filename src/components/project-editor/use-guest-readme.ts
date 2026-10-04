import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "@root/store";
import type { IProject } from "@comp/projects/types";
import type { IWorkspaceLayoutNode } from "./types";
import {
    switchPanelTab,
    tabOpenByDocumentUid,
    toggleMaximizePanel
} from "./actions";

/** Select the README once per visit after restoring a guest's workspace. */
export function useGuestReadme(project: IProject) {
    const dispatch = useDispatch();
    const visit = useRef({ projectUid: project.projectUid, handled: false });
    const workspace = useSelector((state) => state.ProjectEditorReducer);
    const login = useSelector((state) => state.LoginReducer);

    useEffect(() => {
        if (visit.current.projectUid !== project.projectUid)
            visit.current = { projectUid: project.projectUid, handled: false };
        if (
            workspace.initializedProjectUid !== project.projectUid ||
            login.requesting ||
            visit.current.handled
        )
            return;
        visit.current.handled = true;
        if (login.authenticated && login.loggedInUid === project.userUid)
            return;

        const readmes = Object.values(project.documents).filter(
            (document) =>
                document.type === "txt" && document.filename === "README.md"
        );
        const readme =
            readmes.find((document) => !document.path?.length) ?? readmes[0];
        if (!readme) return;

        const panels: IWorkspaceLayoutNode[] = [workspace.root];
        while (panels.length) {
            const node = panels.pop()!;
            if (node.kind === "split") {
                panels.push(node.second, node.first);
                continue;
            }
            const index = node.tabs.findIndex(
                (tab) =>
                    tab.type === "editor" &&
                    tab.uid === readme.documentUid &&
                    !tab.temporary &&
                    !tab.isNonCloudDocument
            );
            if (index >= 0) {
                if (
                    workspace.maximizedPanelId &&
                    workspace.maximizedPanelId !== node.id
                )
                    dispatch(toggleMaximizePanel(workspace.maximizedPanelId));
                dispatch(switchPanelTab(node.id, index));
                return;
            }
        }
        // The README was closed on the previous visit. Keep the other tabs.
        if (
            workspace.maximizedPanelId &&
            workspace.maximizedPanelId !== workspace.activePanelId
        )
            dispatch(toggleMaximizePanel(workspace.maximizedPanelId));
        void dispatch(
            tabOpenByDocumentUid(readme.documentUid, project.projectUid)
        );
    }, [dispatch, project, workspace, login]);
}
