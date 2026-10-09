import type { SourceDiagnostic } from "./types";

interface LocatedDiagnostics {
    text: string;
    diagnostics: SourceDiagnostic[];
}
const listeners = new Map<string, Set<(result: LocatedDiagnostics) => void>>();
export function watchCompiler(
    documentUid: string,
    receive: (result: LocatedDiagnostics) => void
) {
    const subscribers = listeners.get(documentUid) || new Set();
    subscribers.add(receive);
    listeners.set(documentUid, subscribers);
    return () => {
        subscribers.delete(receive);
        if (!subscribers.size) listeners.delete(documentUid);
    };
}
export function compilerDiagnostics(
    documentUid: string,
    text: string,
    diagnostics: SourceDiagnostic[]
) {
    listeners
        .get(documentUid)
        ?.forEach((receive) => receive({ text, diagnostics }));
}
