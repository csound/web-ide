import { curry, find, path, pathOr, propEq, values } from "ramda";
import { IStore } from "@store/types";
import { ITarget } from "./types";
import { IDocument } from "@comp/projects/types";
import { playORCFromString, playCSDFromEMFS } from "@comp/csound/actions";
import { filenameToCsoundType } from "@comp/csound/utils";

const getDefaultTargetName = (store, projectUid): string | undefined =>
    path(["TargetControlsReducer", projectUid, "defaultTarget"], store);

export const getDefaultTargetDocument = curry((projectUid, store):
    | IDocument
    | undefined => {
    const maybeDefaultTarget: ITarget | undefined = path(
        [
            "TargetControlsReducer",
            projectUid,
            "targets",
            getDefaultTargetName(store, projectUid) || ""
        ],
        store
    );

    const projectCsdFallback = find(
        propEq("filename", "project.csd"),
        values(
            pathOr(
                {},
                ["ProjectsReducer", "projects", projectUid, "documents"],
                store
            )
        )
    );

    // ATT: fallback to project.csd is to prevserve fallback behaviour
    // This should be marked as a deprecated fallback, soonish
    const targetDocument: IDocument | undefined = maybeDefaultTarget
        ? path(
              [
                  "ProjectsReducer",
                  "projects",
                  projectUid,
                  "documents",
                  (maybeDefaultTarget as ITarget).targetType === "main"
                      ? maybeDefaultTarget &&
                        maybeDefaultTarget.targetDocumentUid
                      : maybeDefaultTarget &&
                        pathOr(
                            "",
                            ["playlistDocumentsUid", 0],
                            maybeDefaultTarget as ITarget
                        )
              ],
              store
          )
        : projectCsdFallback;
    return targetDocument;
});

export const getPlayActionFromProject = curry(
    (projectUid: string, store: IStore) => {
        const targetDocument = getDefaultTargetDocument(projectUid, store);
        if (!targetDocument) {
            return;
        }
        const csoundDocumentType = filenameToCsoundType(
            (targetDocument as IDocument).filename
        );
        switch (csoundDocumentType) {
            case "csd": {
                return playCSDFromEMFS(
                    projectUid,
                    (targetDocument as IDocument).filename
                );
            }
            case "orc": {
                return playORCFromString(
                    projectUid,
                    (targetDocument as IDocument).savedValue
                );
            }
        }
    }
);

export const getPlayActionFromTarget = (
    store: IStore
): undefined | ((dispatch: any) => void) => {
    const selectedTarget = path(
        ["TargetControlsReducer", "selectedTarget"],
        store
    );

    const selectedTargetPlaylistIndex = pathOr(
        -1,
        ["TargetControlsReducer", "selectedTargetPlaylistIndex"],
        store
    );
    const activeProjectUid = path(
        ["ProjectsReducer", "activeProjectUid"],
        store
    );
    if (!selectedTarget || !activeProjectUid) {
        return;
    }

    const target: ITarget | undefined = path(
        [
            "ProjectsReducer",
            "projects",
            activeProjectUid,
            "targets",
            selectedTarget
        ],
        store
    );

    if (!target) {
        return;
    }

    const targetDocument: IDocument | undefined =
        target &&
        path(
            [
                "ProjectsReducer",
                "projects",
                activeProjectUid,
                "documents",
                target && (target as ITarget).targetType === "main"
                    ? target && (target as ITarget).targetDocumentUid
                    : target &&
                      pathOr(
                          "",
                          ["playlistDocumentsUid", selectedTargetPlaylistIndex],
                          target as ITarget
                      )
            ],
            store
        );

    if (targetDocument && (targetDocument as IDocument).filename) {
        const csoundDocumentType = filenameToCsoundType(
            (targetDocument as IDocument).filename
        );
        switch (csoundDocumentType) {
            case "csd": {
                return playCSDFromEMFS(
                    activeProjectUid,
                    (targetDocument as IDocument).filename
                );
            }
            case "orc": {
                return playORCFromString(
                    activeProjectUid,
                    (targetDocument as IDocument).savedValue
                );
            }
        }
    }
};
