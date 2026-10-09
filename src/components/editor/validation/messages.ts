import type { SourceDiagnostic } from "./types";

interface LocatedDiagnostics {
    text: string;
    diagnostics: SourceDiagnostic[];
}
const listeners = new Map<string, Set<(result: LocatedDiagnostics) => void>>();
const compiledDocuments = new Map<string, string>();
const latest = new Map<string, LocatedDiagnostics & { projectUid: string }>();
const MAX_CACHED_DOCUMENTS = 128;
const MAX_CACHED_TEXT_BYTES = 4 * 1024 * 1024;
let cachedBytes = 0;
const keyFor = (projectUid: string, documentUid: string) =>
    JSON.stringify([projectUid, documentUid]);

function forget(key: string) {
    const previous = latest.get(key);
    if (previous) cachedBytes -= previous.text.length * 2;
    latest.delete(key);
    if (!listeners.has(key)) compiledDocuments.delete(key);
}

/** Replay the last diagnostic snapshot; the editor must still match its source text. */
export function watchCompiler(
    projectUid: string,
    documentUid: string,
    receive: (result: LocatedDiagnostics) => void
) {
    const key = keyFor(projectUid, documentUid);
    const subscribers = listeners.get(key) || new Set();
    subscribers.add(receive);
    listeners.set(key, subscribers);
    const previous = latest.get(key);
    if (previous)
        receive({ text: previous.text, diagnostics: previous.diagnostics });
    return () => {
        subscribers.delete(receive);
        if (!subscribers.size) {
            listeners.delete(key);
            if (!latest.has(key)) compiledDocuments.delete(key);
        }
    };
}

/** Replace a project's compile errors, clearing includes marked by an earlier run. */
export function replaceCompilerDiagnostics(
    projectUid: string,
    documents: (LocatedDiagnostics & { documentUid: string })[],
    mainDocumentUid?: string
) {
    for (const { documentUid, text, diagnostics } of documents) {
        const key = keyFor(projectUid, documentUid);
        if (
            documentUid === mainDocumentUid ||
            diagnostics.length ||
            compiledDocuments.has(key)
        )
            compilerDiagnostics(projectUid, documentUid, text, diagnostics);
        if (diagnostics.length && (listeners.has(key) || latest.has(key)))
            compiledDocuments.set(key, projectUid);
        else compiledDocuments.delete(key);
    }
}

/** Keep bounded snapshots for unopened includes as well as notifying open editors. */
export function compilerDiagnostics(
    projectUid: string,
    documentUid: string,
    text: string,
    diagnostics: SourceDiagnostic[]
) {
    const key = keyFor(projectUid, documentUid);
    forget(key);
    const size = text.length * 2;
    if (diagnostics.length && size <= MAX_CACHED_TEXT_BYTES) {
        latest.set(key, { projectUid, text, diagnostics });
        cachedBytes += size;
        while (
            latest.size > MAX_CACHED_DOCUMENTS ||
            cachedBytes > MAX_CACHED_TEXT_BYTES
        )
            forget(latest.keys().next().value!);
    }
    listeners.get(key)?.forEach((receive) => receive({ text, diagnostics }));
}

/** Forget a superseded snapshot, or the whole project when it leaves the editor. */
export function clearCompilerDiagnostics(
    projectUid: string,
    documentUid?: string
) {
    if (documentUid !== undefined) {
        const key = keyFor(projectUid, documentUid);
        forget(key);
        compiledDocuments.delete(key);
        return;
    }
    for (const [key, entry] of latest)
        if (entry.projectUid === projectUid) forget(key);
    for (const [key, owner] of compiledDocuments)
        if (owner === projectUid) compiledDocuments.delete(key);
}
