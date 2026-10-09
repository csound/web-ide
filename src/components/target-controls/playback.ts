import { equals } from "ramda";
import { store } from "@root/store";
import type { SetConsole } from "@comp/console/context";
import {
    documentPath,
    isCsoundBusy,
    runPerformance
} from "@comp/csound/actions";
import { SET_CURRENTLY_PLAYING_PROJECT } from "@comp/profile/types";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import {
    selectPlaybackDocuments,
    selectPlaybackMode,
    selectPlaylistIndex
} from "./selectors";
import { setPlaylistIndex } from "./actions";

interface Playback {
    projectUid: string;
    documentUid: string;
    playlist: boolean;
    controller: AbortController;
}
let current: Playback | undefined;
let snapshot: Playback | undefined;
const listeners = new Set<() => void>();
const notify = () => {
    snapshot = current ? { ...current } : undefined;
    listeners.forEach((listener) => listener());
};
export const projectPlayback = () => snapshot;
export const subscribeProjectPlayback = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export function stopProjectPlayback(projectUid: string) {
    if (current?.projectUid === projectUid) current.controller.abort();
}

/** One tab auditions one file; the transport plays the remaining playlist. */
export async function playProject(
    projectUid: string,
    setConsole: SetConsole,
    onlyDocumentUid?: string,
    signal?: AbortSignal
) {
    signal?.throwIfAborted();
    if (current || isCsoundBusy())
        throw new Error("Stop playback before playing another file.");
    const state = store.getState();
    const documents = selectPlaybackDocuments(state, projectUid);
    const documentUids = documents.map((document) => document.documentUid);
    const mode = selectPlaybackMode(state, projectUid);
    const playlist = !onlyDocumentUid && mode === "playlist";
    const start = onlyDocumentUid
        ? documents.findIndex(
              (document) => document.documentUid === onlyDocumentUid
          )
        : selectPlaylistIndex(state, projectUid);
    const queue = playlist
        ? documents.slice(start)
        : documents.slice(start, start + 1);
    if (start < 0 || !queue.length)
        throw new Error("Choose a CSD or ORC file in Playback settings.");
    const run: Playback = {
        projectUid,
        documentUid: queue[0].documentUid,
        playlist,
        controller: new AbortController()
    };
    const cancel = () => run.controller.abort();
    signal?.addEventListener("abort", cancel, { once: true });
    current = run;
    const unsubscribe = store.subscribe(() => {
        const next = store.getState();
        // Files and saved targets arrive separately. Keep a run when the saved
        // target selects the same files and mode as the fallback already in use.
        if (
            !next.ProjectsReducer.projects[projectUid]?.documents[
                run.documentUid
            ] ||
            selectPlaybackMode(next, projectUid) !== mode ||
            !equals(
                selectPlaybackDocuments(next, projectUid).map(
                    (document) => document.documentUid
                ),
                documentUids
            )
        )
            run.controller.abort();
    });
    const finish = () => {
        unsubscribe();
        signal?.removeEventListener("abort", cancel);
        if (current === run) {
            current = undefined;
            notify();
        }
    };
    const reportError = (error: unknown) => {
        finish();
        if (!run.controller.signal.aborted)
            store.dispatch(
                openSnackbar(
                    error instanceof Error
                        ? error.message
                        : "Could not play this file.",
                    SnackbarType.Error
                )
            );
    };
    const play = async (index: number): Promise<void> => {
        run.controller.signal.throwIfAborted();
        const allDocuments =
            store.getState().ProjectsReducer.projects[projectUid]?.documents;
        const document = allDocuments?.[queue[index].documentUid];
        if (!document)
            throw new Error(
                "A playlist file was removed. Choose a new starting track."
            );
        run.documentUid = document.documentUid;
        if (playlist)
            store.dispatch(setPlaylistIndex(projectUid, start + index));
        notify();
        const result = await runPerformance({
            projectUid,
            ...(/\.csd$/i.test(document.filename)
                ? { csdPath: documentPath(document, allDocuments) }
                : { orcPath: documentPath(document, allDocuments) }),
            mode: "play",
            signal: run.controller.signal,
            setConsole,
            onEnded: (reason) => {
                if (current !== run) return;
                if (
                    reason === "completed" &&
                    !run.controller.signal.aborted &&
                    index + 1 < queue.length
                ) {
                    void play(index + 1).catch(reportError);
                } else {
                    finish();
                    if (playlist && reason === "completed")
                        store.dispatch(setPlaylistIndex(projectUid, 0));
                }
            }
        });
        // Each engine's cleanup clears the profile's playing project. Restore
        // it when the next track starts, but never after a finished/cancelled run.
        if (
            result.status === "playing" &&
            current === run &&
            run.documentUid === document.documentUid &&
            !run.controller.signal.aborted
        )
            store.dispatch({
                type: SET_CURRENTLY_PLAYING_PROJECT,
                projectUid
            });
    };
    try {
        await play(0);
    } catch (error) {
        finish();
        if (!run.controller.signal.aborted) throw error;
    }
}
