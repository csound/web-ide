import { describe, expect, it } from "vitest";
import ProjectEditorReducer from "./reducer";
import { TAB_DOCK_INIT } from "./types";

describe("ProjectEditorReducer", () => {
    it("opens the console in the bottom sidebar by default", () => {
        const state = ProjectEditorReducer(undefined, { type: "@@INIT" });

        expect(state.bottomSidebar?.tabs).toEqual([
            expect.objectContaining({
                id: "sidebar-bottom-console",
                type: "console",
                uid: "console"
            })
        ]);
        expect(state.bottomSidebar?.tabIndex).toBe(0);
    });

    it("keeps the default console when initializing a fresh workspace", () => {
        const state = ProjectEditorReducer(undefined, {
            type: TAB_DOCK_INIT,
            initialOpenDocuments: [{ uid: "project.csd" }],
            initialIndex: 0
        });

        expect(state.bottomSidebar?.tabs[0]).toEqual(
            expect.objectContaining({
                id: "sidebar-bottom-console",
                type: "console"
            })
        );
        expect(state.root.kind).toBe("panel");
    });
});
