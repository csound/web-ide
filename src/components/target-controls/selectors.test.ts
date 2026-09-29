import { beforeEach, describe, expect, it, vi } from "vitest";
import { store } from "../../store";
import { getSelectedTargetDocumentUid } from "./selectors";

vi.mock("@csound/browser", () => ({ Csound: vi.fn(), libcsound: vi.fn() }));

beforeEach(() => {
    store.dispatch({
        type: "PROJECTS.UNSET_PROJECT",
        projectUid: "target-test"
    });
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [
            {
                projectUid: "target-test",
                documents: Object.fromEntries(
                    [
                        ["fallback", "project.csd"],
                        ["main", "main.csd"],
                        ["first", "first.csd"],
                        ["second", "second.csd"]
                    ].map(([documentUid, filename]) => [
                        documentUid,
                        {
                            documentUid,
                            filename,
                            type: "txt",
                            path: [],
                            currentValue: ""
                        }
                    ])
                )
            }
        ]
    });
});

function select(
    target: Record<string, unknown>,
    selectedTarget: string | null = "chosen",
    index = 1
) {
    store.dispatch({
        type: "TARGET_CONTROL.SET_SELECTED_TARGET",
        projectUid: "target-test",
        selectedTarget: {
            selectedTarget,
            defaultTarget: "chosen",
            selectedTargetPlaylistIndex: index,
            targets: { chosen: { targetName: "chosen", ...target } }
        }
    });
    return getSelectedTargetDocumentUid("target-test")(store.getState());
}

describe("selected target document", () => {
    it("uses the selected playlist entry even when an old main document remains", () => {
        expect(
            select({
                targetType: "playlist",
                targetDocumentUid: "main",
                playlistDocumentsUid: ["first", "second"]
            })
        ).toBe("second");
    });

    it("uses the main document even when old playlist entries remain", () => {
        expect(
            select({
                targetType: "main",
                targetDocumentUid: "main",
                playlistDocumentsUid: ["first", "second"]
            })
        ).toBe("main");
    });

    it("starts a default playlist at its first entry when no target is selected", () => {
        expect(
            select(
                {
                    targetType: "playlist",
                    playlistDocumentsUid: ["first", "second"]
                },
                null
            )
        ).toBe("first");
    });

    it.each([
        { targetType: "main" },
        { targetType: "main", targetDocumentUid: "deleted" },
        { targetType: "playlist", playlistDocumentsUid: [] },
        { targetType: "playlist", playlistDocumentsUid: ["first", "deleted"] }
    ])(
        "falls back to project.csd when the target has no usable document: %j",
        (target) => {
            expect(select(target)).toBe("fallback");
        }
    );

    it("falls back when the selected target no longer exists", () => {
        expect(select({}, "removed")).toBe("fallback");
    });
});
