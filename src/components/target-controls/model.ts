import type { IDocument } from "@comp/projects/types";
import type { ITarget } from "./types";
import type { ITargetControl } from "./reducer";

/** Prefer conventional main filenames, then a CSD, then an ORC. */
export const findFallbackPlayTarget = (
    allDocuments: Record<string, IDocument> | IDocument[]
): IDocument | undefined => {
    const documents = (
        Array.isArray(allDocuments)
            ? allDocuments
            : Object.values(allDocuments || {})
    ).filter(isPlayableDocument);
    return (
        documents.find((document) =>
            /^(project|default)\.csd$/i.test(document.filename)
        ) ??
        documents.find((document) => /\.csd$/i.test(document.filename)) ??
        documents[0]
    );
};

export const isPlayableDocument = (document: IDocument) =>
    document.type !== "folder" && /\.(csd|orc)$/i.test(document.filename);

/** Old projects keep their saved default until the owner changes the mode. */
export function projectTarget(controls?: ITargetControl): ITarget | undefined {
    const targets = controls?.targets ?? {};
    return (
        (controls?.defaultTarget && targets[controls.defaultTarget]) ||
        Object.values(targets)[0]
    );
}

export function playbackDocuments(
    controls: ITargetControl | undefined,
    documents: Record<string, IDocument> = {}
): IDocument[] {
    const target = projectTarget(controls);
    if (target?.targetType === "playlist") {
        return [...new Set(target.playlistDocumentsUid ?? [])]
            .map((uid) => documents[uid])
            .filter((document) => document && isPlayableDocument(document));
    }
    const main =
        target?.targetDocumentUid && documents[target.targetDocumentUid];
    const document =
        main && isPlayableDocument(main)
            ? main
            : findFallbackPlayTarget(documents);
    return document ? [document] : [];
}
