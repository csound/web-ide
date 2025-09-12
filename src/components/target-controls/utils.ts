import { curry, find, path, pathOr, propEq, values } from "ramda";
import { RootState } from "@root/store";
import { ITarget, ITargetMap } from "./types";
import { IDocument } from "@comp/projects/types";
import { CsoundObj } from "@csound/browser";
import { playORCFromString, playCsdFromFs } from "@comp/csound/actions";
import { filenameToCsoundType } from "@comp/csound/utils";

/**
 * Helper function to find fallback play target if none is found.
 * Priority order:
 * 1. project.csd or default.csd
 * 2. Any .csd file
 * 3. Fallback to any .csd or .orc file
 */
export const findFallbackPlayTarget = (
    allDocuments: Record<string, IDocument> | IDocument[]
): IDocument | undefined => {
    const documentsArray = Array.isArray(allDocuments)
        ? allDocuments
        : Object.values(allDocuments || {});

    if (documentsArray.length === 0) {
        return undefined;
    }

    // 1. Look for project.csd or default.csd
    const priorityFiles = documentsArray.find(
        (doc) =>
            doc.filename === "project.csd" || doc.filename === "default.csd"
    );
    if (priorityFiles) {
        return priorityFiles;
    }

    // 2. Look for any .csd file
    const csdFiles = documentsArray.filter((doc) =>
        doc.filename.endsWith(".csd")
    );
    if (csdFiles.length > 0) {
        return csdFiles[0];
    }

    // 3. Fallback to any .csd or .orc file
    const csoundFiles = documentsArray.filter(
        (doc) => doc.filename.endsWith(".csd") || doc.filename.endsWith(".orc")
    );
    if (csoundFiles.length > 0) {
        return csoundFiles[0];
    }

    return undefined;
};

/**
 * Helper function to find fallback target name from targets array.
 * Priority order:
 * 1. project.csd or default.csd
 * 2. Any .csd target
 * 3. Fallback to any .csd or .orc target
 * 4. First available target
 */
export const findFallbackTargetName = (
    targetsValues: ITarget[]
): string | undefined => {
    if (!targetsValues || targetsValues.length === 0) {
        return undefined;
    }

    // 1. Look for project.csd or default.csd targets
    const priorityTarget = targetsValues.find(
        (t) => t.targetName === "project.csd" || t.targetName === "default.csd"
    );
    if (priorityTarget) {
        return priorityTarget.targetName;
    }

    // 2. Look for any .csd target
    const csdTarget = targetsValues.find((t) => t.targetName.endsWith(".csd"));
    if (csdTarget) {
        return csdTarget.targetName;
    }

    // 3. Fallback to any .csd or .orc target
    const csoundTarget = targetsValues.find(
        (t) => t.targetName.endsWith(".csd") || t.targetName.endsWith(".orc")
    );
    if (csoundTarget) {
        return csoundTarget.targetName;
    }

    // 4. Final fallback to first available target
    return targetsValues[0]?.targetName;
};

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
            store.TargetControlsReducer[projectUid]?.targets && targetName
                ? store.TargetControlsReducer[projectUid].targets[targetName]
                : undefined;

        const documentId =
            maybeDefaultTarget &&
            (maybeDefaultTarget as ITarget).targetType === "main"
                ? maybeDefaultTarget && maybeDefaultTarget.targetDocumentUid
                : maybeDefaultTarget &&
                  Array.isArray(maybeDefaultTarget.playlistDocumentsUid) &&
                  maybeDefaultTarget.playlistDocumentsUid[0];

        if (documentId && maybeDefaultTarget) {
            return store.ProjectsReducer.projects[projectUid].documents[
                documentId
            ];
        }

        // Use the same fallback logic as everywhere else
        const allDocuments =
            store?.ProjectsReducer?.projects?.[projectUid]?.documents || {};

        return findFallbackPlayTarget(allDocuments);
    };

// Helper function to get default target document without circular dependency
const getDefaultTargetDocumentInternal = (
    projectUid: string,
    store: RootState
): IDocument | undefined => {
    const defaultTargetName =
        store.TargetControlsReducer[projectUid]?.defaultTarget;
    const targets = store.TargetControlsReducer[projectUid]?.targets;
    const allDocuments =
        store?.ProjectsReducer?.projects?.[projectUid]?.documents;

    if (!allDocuments) return undefined;

    // If we have a default target, try to use it
    if (defaultTargetName && targets?.[defaultTargetName]) {
        const defaultTarget = targets[defaultTargetName];
        const documentId =
            defaultTarget.targetType === "main"
                ? defaultTarget.targetDocumentUid
                : defaultTarget.playlistDocumentsUid?.[0];

        if (documentId && allDocuments[documentId]) {
            return allDocuments[documentId];
        }
    }

    // Fall back to our helper function
    return findFallbackPlayTarget(allDocuments);
};

export const getPlayActionFromProject = curry(
    (projectUid: string, store: RootState) => {
        const targetDocument = getDefaultTargetDocumentInternal(
            projectUid,
            store
        );
        if (!targetDocument) {
            return;
        }

        const target: ITarget | undefined =
            store?.TargetControlsReducer?.[projectUid]?.targets?.[
                targetDocument.documentUid
            ];

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
        const selectedTarget =
            store?.TargetControlsReducer?.[projectUid]?.selectedTarget;

        const selectedTargetPlaylistIndex =
            store?.TargetControlsReducer?.[projectUid]
                ?.selectedTargetPlaylistIndex ?? -1;

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
                  target.playlistDocumentsUid?.[selectedTargetPlaylistIndex];

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
