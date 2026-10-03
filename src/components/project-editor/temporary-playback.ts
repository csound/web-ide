import { isCsoundBusy, runPerformance } from "../csound/actions";
import type { SetConsole } from "../console/context";
import { loadManualExampleAssets } from "./manual-examples";
import type { TemporaryDocument } from "./temporary-documents";

let current:
    | { uid: string; projectUid: string; controller: AbortController }
    | undefined;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
export const subscribeTemporaryPlayback = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
export const temporaryPlaybackUid = () => current?.uid;

export async function playTemporaryDocument(
    projectUid: string,
    uid: string,
    document: TemporaryDocument,
    setConsole: SetConsole
) {
    if (current || isCsoundBusy())
        throw new Error("Stop playback before playing an example.");
    const run = { uid, projectUid, controller: new AbortController() };
    current = run;
    notify();
    const finish = () => {
        if (current === run) {
            current = undefined;
            notify();
        }
    };
    try {
        const inputFiles = await loadManualExampleAssets(
            document,
            run.controller.signal
        );
        run.controller.signal.throwIfAborted();
        await runPerformance({
            projectUid,
            csdText: document.value,
            mode: "play",
            inputFiles,
            collectFiles: false,
            signal: run.controller.signal,
            setConsole,
            onEnded: finish
        });
    } catch (error) {
        finish();
        if (!run.controller.signal.aborted) throw error;
    }
}

export function stopTemporaryDocument(uid: string) {
    if (current?.uid === uid) current.controller.abort();
}

/** Tab switches keep playing; discarding the last copy or leaving stops it. */
export function retainTemporaryPlayback(
    projectUid: string,
    openUids: string[]
) {
    if (current?.projectUid === projectUid && !openUids.includes(current.uid))
        current.controller.abort();
}
