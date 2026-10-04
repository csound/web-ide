import { beforeEach, describe, expect, it, vi } from "vitest";
import { store } from "../../store";
import {
    getSelectedTargetDocumentUid,
    selectPlaybackDocuments
} from "./selectors";
import {
    setPlaylistIndex,
    setSelectedTarget,
    updateAllTargetsLocally
} from "./actions";
import type { ITarget } from "./types";

vi.mock("@csound/browser", () => ({ Csound: vi.fn(), libcsound: vi.fn() }));
const projectUid = "target-test";
beforeEach(() => {
    store.dispatch({ type: "PROJECTS.UNSET_PROJECT", projectUid });
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [
            {
                projectUid,
                documents: Object.fromEntries(
                    [
                        ["fallback", "project.csd"],
                        ["main", "main.csd"],
                        ["first", "first.csd"],
                        ["second", "second.orc"],
                        ["sample", "loop.wav"]
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
function select(target: Partial<ITarget>, index = 0) {
    updateAllTargetsLocally(store.dispatch, "chosen", projectUid, {
        chosen: {
            targetName: "chosen",
            targetType: "main",
            csoundOptions: {},
            ...target
        }
    });
    store.dispatch(setPlaylistIndex(projectUid, index));
    return getSelectedTargetDocumentUid(projectUid)(store.getState());
}
describe("project playback selection", () => {
    it("selects a playlist entry despite stale main fields", () => {
        expect(
            select(
                {
                    targetType: "playlist",
                    targetDocumentUid: "main",
                    playlistDocumentsUid: ["first", "second"]
                },
                1
            )
        ).toBe("second");
    });
    it("uses one main file despite stale playlist fields", () => {
        expect(
            select(
                {
                    targetDocumentUid: "main",
                    playlistDocumentsUid: ["first", "second"]
                },
                1
            )
        ).toBe("main");
    });
    it("starts playlists at the first file and resets selection on a config update", () => {
        select(
            {
                targetType: "playlist",
                playlistDocumentsUid: ["first", "second"]
            },
            1
        );
        expect(
            select({
                targetType: "playlist",
                playlistDocumentsUid: ["second", "first"]
            })
        ).toBe("second");
    });
    it("skips missing, duplicate and non-playable entries without playing an included file", () => {
        select(
            {
                targetType: "playlist",
                playlistDocumentsUid: [
                    "missing",
                    "first",
                    "first",
                    "sample",
                    "second"
                ]
            },
            99
        );
        expect(
            selectPlaybackDocuments(store.getState(), projectUid).map(
                (document) => document.documentUid
            )
        ).toEqual(["first", "second"]);
        expect(getSelectedTargetDocumentUid(projectUid)(store.getState())).toBe(
            "second"
        );
        expect(
            select({ targetType: "playlist", playlistDocumentsUid: [] })
        ).toBeUndefined();
    });
    it.each([{}, { targetDocumentUid: "deleted" }])(
        "falls back for an unset main file",
        (target) => {
            expect(select(target)).toBe("fallback");
        }
    );
    it("keeps a legacy project's saved default and preserves its map when selecting", async () => {
        const targets = {
            other: {
                targetName: "other",
                targetType: "main",
                targetDocumentUid: "first",
                csoundOptions: {}
            },
            chosen: {
                targetName: "chosen",
                targetType: "main",
                targetDocumentUid: "main",
                csoundOptions: {}
            }
        };
        updateAllTargetsLocally(store.dispatch, "chosen", projectUid, targets);
        await store.dispatch(setSelectedTarget(projectUid, "other"));
        expect(
            store.getState().TargetControlsReducer[projectUid].targets
        ).toEqual(targets);
        expect(getSelectedTargetDocumentUid(projectUid)(store.getState())).toBe(
            "main"
        );
    });
});
