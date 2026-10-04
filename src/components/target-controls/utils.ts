import { createSelector } from "reselect";
import type { RootState } from "@root/store";
import { selectPlaybackDocuments } from "./selectors";
import { playProject } from "./playback";
export { findFallbackPlayTarget } from "./model";

export const getDefaultTargetDocument =
    (projectUid: string) => (state: RootState) =>
        selectPlaybackDocuments(state, projectUid)[0];

export const getPlayActionFromProject = (projectUid: string) =>
    createSelector(
        [(state: RootState) => selectPlaybackDocuments(state, projectUid)],
        (documents) =>
            documents.length
                ? (
                      _dispatch: unknown,
                      setConsole: React.Dispatch<
                          React.SetStateAction<string[]>
                      > = () => {}
                  ) => playProject(projectUid, setConsole)
                : undefined
    );
export const getPlayActionFromTarget = getPlayActionFromProject;
