import { curry, find, path, pathOr, propEq, values } from "ramda";
import { RootState } from "@root/store";
import { ITarget, ITargetMap } from "./types";
import { IDocument } from "@comp/projects/types";
import { CsoundObj } from "@csound/browser";
import { playORCFromString, playCsdFromFs } from "@comp/csound/actions";
import { filenameToCsoundType } from "@comp/csound/utils";

const getDefaultTargetName = (
    store: RootState,
    projectUid: string
): string | undefined => {
    return store.TargetControlsReducer[projectUid]?.defaultTarget ?? undefined;
};

export const getDefaultTargetDocument =
    (projectUid: string) =>
    (store: RootState): IDocument | undefined => {
        const targetName = getDefaultTargetName(store, projectUid);
        const maybeDefaultTarget: ITarget | undefined =
            store.TargetControlsReducer.targets && targetName
                ? store.TargetControlsReducer[projectUid].targets[targetName]
                : undefined;

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

        const documentId =
            (maybeDefaultTarget as ITarget).targetType === "main"
                ? maybeDefaultTarget && maybeDefaultTarget.targetDocumentUid
                : maybeDefaultTarget &&
                  Array.isArray(maybeDefaultTarget.playlistDocumentsUid) &&
                  maybeDefaultTarget.playlistDocumentsUid[0];

        // ATT: fallback to project.csd is to prevserve fallback behaviour
        // This should be marked as a deprecated fallback, soonish
        const targetDocument: IDocument | undefined =
            documentId && maybeDefaultTarget
                ? store.ProjectsReducer.projects[projectUid].documents[
                      documentId
                  ]
                : (projectCsdFallback as unknown as IDocument);

        return targetDocument;
    };

export const getPlayActionFromProject = curry(
    (projectUid: string, store: RootState) => {
        const targetDocument = getDefaultTargetDocument(projectUid)(store);

        if (!targetDocument) {
            return;
        }

        const target: ITarget | undefined = path(
            [
                "TargetControlsReducer",
                projectUid,
                "targets",
                targetDocument.documentUid
            ],
            store
        );

        const useCsound7 = target?.useCsound7 ?? false;

        const csoundDocumentType = filenameToCsoundType(
            (targetDocument as IDocument).filename
        );
        switch (csoundDocumentType) {
            case "csd": {
                return playCsdFromFs({
                    projectUid,
                    csdPath: (targetDocument as IDocument).filename,
                    useCsound7
                });
            }
            case "orc": {
                return playORCFromString({
                    projectUid,
                    orc: (targetDocument as IDocument).savedValue,
                    useCsound7
                });
            }
        }
    }
);

export const getPlayActionFromTarget =
    (projectUid: string) =>
    (
        store: RootState
    ): undefined | ((dispatch: any, csound: CsoundObj) => Promise<void>) => {
        const selectedTarget = path(
            ["TargetControlsReducer", projectUid, "selectedTarget"],
            store
        );

        const selectedTargetPlaylistIndex = pathOr(
            -1,
            [
                "TargetControlsReducer",
                projectUid,
                "selectedTargetPlaylistIndex"
            ],
            store
        );

        const target: ITarget | undefined = selectedTarget
            ? store.TargetControlsReducer[projectUid].targets[selectedTarget]
            : undefined;

        if (!target) {
            return;
        }

        const useCsound7 = target.useCsound7 || false;

        const documentId =
            target && (target as ITarget).targetType === "main"
                ? target && (target as ITarget).targetDocumentUid
                : target &&
                  pathOr(
                      "",
                      ["playlistDocumentsUid", selectedTargetPlaylistIndex],
                      target as ITarget
                  );
        const targetDocument: IDocument | undefined =
            target && documentId
                ? store.ProjectsReducer.projects[projectUid].documents[
                      documentId
                  ]
                : undefined;

        if (targetDocument && (targetDocument as IDocument).filename) {
            const csoundDocumentType = filenameToCsoundType(
                (targetDocument as IDocument).filename
            );
            switch (csoundDocumentType) {
                case "csd": {
                    return playCsdFromFs({
                        projectUid,
                        csdPath: (targetDocument as IDocument).filename,
                        useCsound7
                    });
                }
                case "orc": {
                    return playORCFromString({
                        projectUid,
                        orc: (targetDocument as IDocument).savedValue,
                        useCsound7
                    });
                }
            }
        }
    };
