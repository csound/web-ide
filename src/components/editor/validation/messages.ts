import type { SourceDiagnostic } from "./types";

interface LocatedDiagnostics {
    text: string;
    diagnostics: SourceDiagnostic[];
}
const listeners = new Map<string, Set<(result: LocatedDiagnostics) => void>>();
// Only mounted editors can hold markers. Drop this bookkeeping on unmount.
const compiledDocuments = new Set<string>();

/** Subscribe to diagnostics for an open document; callers check the source snapshot. */
export function watchCompiler(
    documentUid: string,
    receive: (result: LocatedDiagnostics) => void
) {
    const subscribers = listeners.get(documentUid) || new Set();
    subscribers.add(receive);
    listeners.set(documentUid, subscribers);
    return () => {
        subscribers.delete(receive);
        if (!subscribers.size) {
            listeners.delete(documentUid);
            compiledDocuments.delete(documentUid);
        }
    };
}

/** Replace a project's compile errors, clearing includes marked by an earlier run. */
export function replaceCompilerDiagnostics(
    documents: (LocatedDiagnostics & { documentUid: string })[],
    mainDocumentUid?: string
) {
    for (const { documentUid, text, diagnostics } of documents) {
        if (
            documentUid === mainDocumentUid ||
            diagnostics.length ||
            compiledDocuments.has(documentUid)
        )
            compilerDiagnostics(documentUid, text, diagnostics);
        if (diagnostics.length && listeners.has(documentUid))
            compiledDocuments.add(documentUid);
        else compiledDocuments.delete(documentUid);
    }
}

/** Publish errors only to open editors, together with the text that produced them. */
export function compilerDiagnostics(
    documentUid: string,
    text: string,
    diagnostics: SourceDiagnostic[]
) {
    listeners
        .get(documentUid)
        ?.forEach((receive) => receive({ text, diagnostics }));
}
