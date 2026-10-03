import { describe, expect, it } from "vitest";
import ProjectEditorReducer from "./reducer";
import { TAB_DOCK_INIT, MANUAL_LOOKUP_STRING } from "./types";

describe("ProjectEditorReducer", () => {
    it("repeats an opcode lookup without adding another manual panel", () => {
        const initial = ProjectEditorReducer(undefined, { type: "@@INIT" });
        const action = {
            type: MANUAL_LOOKUP_STRING,
            manualLookupString: "oscili"
        };
        const first = ProjectEditorReducer(initial, action);
        const second = ProjectEditorReducer(first, action);
        expect(second.manualLookupVersion).toBe(first.manualLookupVersion + 1);
        expect(second.manualLookupString).toBe("oscili");
        expect(
            second.rightSidebar?.tabs.filter((tab) => tab.type === "manual")
        ).toHaveLength(1);
    });
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
