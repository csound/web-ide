import { IWorkspacePanelNode } from "./types";

export const createDefaultBottomSidebar = (): IWorkspacePanelNode => ({
    id: "sidebar-bottom",
    kind: "panel",
    tabs: [
        {
            id: "sidebar-bottom-console",
            type: "console",
            uid: "console",
            editorInstance: undefined
        }
    ],
    tabIndex: 0
});
