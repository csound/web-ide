import { AppThunkDispatch, RootState, store } from "@root/store";
import { Csound, libcsound } from "@csound/browser";
import { IDocument } from "../projects/types";
import { nonCloudFiles, addNonCloudFile } from "@comp/file-tree/actions";
import { openSnackbar } from "@comp/snackbar/actions";
import { openSimpleModal } from "@comp/modal/actions";
import { SnackbarType } from "@comp/snackbar/types";
import {
    CsoundObj,
    ICsoundStatus,
    SET_CSOUND_PLAY_STATE,
    compileCSD
} from "./types";
import { addDocumentToCsoundFS, getUniqueFilename } from "@comp/projects/utils";
import { getSelectedTargetDocumentUid } from "@comp/target-controls/selectors";

export let csoundInstance: CsoundObj;

type SetConsole = React.Dispatch<React.SetStateAction<string[]>>;
type Run = { controller: AbortController; done: Promise<void> };
let activeRun: Run | undefined;

export const setCsoundPlayState = (status: ICsoundStatus) => ({
    type: SET_CSOUND_PLAY_STATE,
    status
});
export const isCsoundBusy = () => !!activeRun;

export function documentPath(
    document: IDocument,
    documents: Record<string, IDocument>
): string {
    return [
        ...document.path.map((id) => documents[id]?.filename ?? id),
        document.filename
    ].join("/");
}

export const syncFs = async (
    csound: CsoundObj,
    projectUid: string,
    state: RootState
): Promise<void> => {
    const documents =
        state.ProjectsReducer.projects[projectUid]?.documents ?? {};
    // Parents must exist before nested folders and files.
    for (const document of Object.values(documents).sort(
        (a, b) => a.path.length - b.path.length
    )) {
        await addDocumentToCsoundFS(
            projectUid,
            csound,
            document,
            documentPath(document, documents)
        );
    }
};

export function outputNameFromCsd(source: string): string | undefined {
    const options =
        source
            .match(/<CsOptions>([\s\S]*?)<\/CsOptions>/i)?.[1]
            ?.replace(/;.*$/gm, " ") ?? "";
    const match = options.match(
        /(?:^|\s)(?:-o\s*|--output(?:=|\s+))(?:"([^"]+)"|'([^']+)'|([^\s]+))/
    );
    const name = match?.slice(1).find(Boolean);
    return name && !/^dac(?:\d+|:.*)?$/.test(name) ? name : undefined;
}

export type PerformanceResult = {
    status: "playing" | "completed";
    files: string[];
};

type PerformanceOptions = {
    projectUid: string;
    csdPath?: string;
    orc?: string;
    mode?: "auto" | "play" | "render";
    signal?: AbortSignal;
    setConsole: SetConsole;
};

// UI and WebMCP share one run and one cancellation path.
export async function runPerformance({
    projectUid,
    csdPath,
    orc,
    mode = "auto",
    signal,
    setConsole
}: PerformanceOptions): Promise<PerformanceResult> {
    if (
        activeRun ||
        ["playing", "paused", "rendering", "loading"].includes(
            store.getState().csound.status
        )
    ) {
        throw new Error(
            "Csound is busy. Stop it before starting another performance."
        );
    }
    signal?.throwIfAborted();
    const snapshot = store.getState();
    const project = snapshot.ProjectsReducer.projects[projectUid];
    if (!project) throw new Error("No project is open.");
    const document = Object.values(project.documents).find(
        (doc) => documentPath(doc, project.documents) === csdPath
    );
    const requestedOutput = document
        ? outputNameFromCsd(document.currentValue)
        : undefined;
    if (mode === "play" && requestedOutput)
        throw new Error(
            "This CSD requests file output. Use csound_render or change CsOptions to -odac."
        );
    const render = mode === "render" || (mode === "auto" && !!requestedOutput);
    const outputName =
        requestedOutput ??
        `${document?.filename.replace(/\.[^.]+$/, "") ?? "render"}.wav`;
    const controller = new AbortController();
    let resolveDone!: () => void;
    const run: Run = {
        controller,
        done: new Promise((resolve) => {
            resolveDone = resolve;
        })
    };
    activeRun = run;
    const cancel = () => controller.abort();
    signal?.addEventListener("abort", cancel, { once: true });
    let csound: CsoundObj | undefined;
    let before: string[] = [];
    let finishPromise: Promise<string[]> | undefined;
    let failed = false;
    const finish = (collect: boolean): Promise<string[]> => {
        if (finishPromise) return finishPromise;
        finishPromise = (async () => {
            const files: string[] = [];
            try {
                if (csound) {
                    // Csound 7 closes output at end-of-score and omits cleanup
                    // on some browser backends; older backends still expose it.
                    await csound.cleanup?.();
                    if (
                        collect &&
                        !failed &&
                        !controller.signal.aborted &&
                        store.getState().ProjectsReducer.activeProjectUid ===
                            projectUid
                    ) {
                        const after = await csound.fs.readdir("/");
                        const candidates = new Set([
                            ...after.filter((name) => !before.includes(name)),
                            ...(render ? [outputName] : [])
                        ]);
                        for (const name of candidates) {
                            let buffer: Uint8Array;
                            try {
                                buffer = await csound.fs.readFile(name);
                            } catch {
                                continue;
                            }
                            if (!buffer?.length) continue;
                            const unique = getUniqueFilename(
                                name.replace(/^\/+/, ""),
                                [...nonCloudFiles.keys()]
                            );
                            nonCloudFiles.set(unique, {
                                buffer,
                                name: unique,
                                createdAt: new Date()
                            });
                            store.dispatch(
                                addNonCloudFile({
                                    name: unique,
                                    createdAt: Date.now()
                                })
                            );
                            files.push(unique);
                        }
                    }
                }
            } finally {
                try {
                    await csound?.terminateInstance();
                } finally {
                    signal?.removeEventListener("abort", cancel);
                    if (activeRun === run) {
                        activeRun = undefined;
                        store.dispatch(
                            setCsoundPlayState(failed ? "error" : "stopped")
                        );
                    }
                    resolveDone();
                }
            }
            return files;
        })();
        return finishPromise;
    };
    // Stop can arrive while the factory, file sync, or compiler is still busy.
    const check = () => controller.signal.throwIfAborted();
    store.dispatch(setCsoundPlayState("loading"));
    setConsole([""]);
    try {
        csound = (await Csound({
            useWorker: render || localStorage.getItem("sab") === "true",
            ...(render ? { useSAB: false } : {})
        })) as CsoundObj | undefined;
        check();
        if (!csound) throw new Error("Csound failed to start.");
        csoundInstance = csound;
        csound.on("message", (message: string) => {
            if (
                /\b[1-9]\d* errors? in performance\b|\bPERF ERROR\b/i.test(
                    message
                )
            )
                failed = true;
            setConsole((lines) => [...lines, message + "\n"]);
        });
        await syncFs(csound, projectUid, snapshot);
        check();
        before = await csound.fs.readdir("/");
        await csound.setOption(render ? `-o${outputName}` : "-odac");
        const compiled = csdPath
            ? await compileCSD(csound, csdPath)
            : await csound.compileOrc(orc ?? "");
        check();
        if (compiled !== 0)
            throw new Error(
                "Csound compilation failed. Read the console for details."
            );
        // CsOptions may override the initial command-line options.
        await csound.setOption(render ? `-o${outputName}` : "-odac");
        const rendered = render
            ? new Promise<void>((resolve) =>
                  csound!.once("renderEnded", resolve)
              )
            : undefined;
        if (!render) {
            csound.on("realtimePerformancePaused", () => {
                if (activeRun === run && !controller.signal.aborted)
                    store.dispatch(setCsoundPlayState("paused"));
            });
            csound.on("realtimePerformanceResumed", () => {
                if (activeRun === run && !controller.signal.aborted)
                    store.dispatch(setCsoundPlayState("playing"));
            });
            csound.once("realtimePerformanceEnded", () => {
                void finish(true).catch(console.error);
            });
        }
        const aborted = new Promise<never>((_resolve, reject) => {
            controller.signal.addEventListener(
                "abort",
                () =>
                    reject(
                        new DOMException(
                            "The performance was cancelled.",
                            "AbortError"
                        )
                    ),
                { once: true }
            );
        });
        if (
            !render &&
            (await Promise.race([csound.isRequestingRtAudioInput(), aborted]))
        ) {
            check();
            try {
                await Promise.race([csound.enableAudioInput(), aborted]);
            } catch (error) {
                check();
                throw new Error(
                    "Could not start microphone input. Check microphone access in your browser and system settings.",
                    { cause: error }
                );
            }
        }
        check();
        store.dispatch(setCsoundPlayState(render ? "rendering" : "playing"));
        const started = await Promise.race([csound.start(), aborted]);
        check();
        if (started !== 0)
            throw new Error(
                "Csound could not start. Read the console for details."
            );
        if (!render) {
            controller.signal.addEventListener(
                "abort",
                () => {
                    void (async () => {
                        try {
                            await csound?.stop();
                        } finally {
                            await finish(false);
                        }
                    })().catch(console.error);
                },
                { once: true }
            );
            return { status: "playing", files: [] };
        }
        // @csound/browser drives the render loop in its worker. Calling
        // performKsmps here would advance the same score twice.
        await Promise.race([rendered, aborted]);
        check();
        if (failed)
            throw new Error(
                "Csound reported a performance error. Read the console for details."
            );
        const files = await finish(true);
        if (!files.length)
            throw new Error(
                "Csound produced no audio file. Check CsOptions and the console."
            );
        return { status: "completed", files };
    } catch (error) {
        failed = !controller.signal.aborted;
        try {
            await csound?.stop();
        } catch {
            /* The engine may not have started. */
        }
        await finish(false);
        if (failed && !activeRun) store.dispatch(setCsoundPlayState("error"));
        throw error;
    }
}

export async function stopPerformance(): Promise<void> {
    const run = activeRun;
    if (run) {
        run.controller.abort();
        await run.done;
    }
}

export const stopCsound = () => async () => {
    // finish() publishes the final state once cleanup and termination finish.
    await stopPerformance().catch(console.error);
};
export const pauseCsound = () => {
    if (csoundInstance) void csoundInstance.pause();
    return setCsoundPlayState("paused");
};
export const resumePausedCsound = () => {
    if (csoundInstance) void csoundInstance.resume();
    return setCsoundPlayState("playing");
};

export const playCsdFromFs =
    ({ projectUid, csdPath }: { projectUid: string; csdPath: string }) =>
    async (
        _dispatch: AppThunkDispatch,
        setConsole: SetConsole
    ): Promise<void> => {
        await runPerformance({ projectUid, csdPath, setConsole });
    };
export const playORCFromString =
    ({ projectUid, orc }: { projectUid: string; orc: string }) =>
    async (
        _dispatch: AppThunkDispatch,
        setConsole: SetConsole
    ): Promise<void> => {
        await runPerformance({ projectUid, orc, setConsole });
    };

export const renderToDisk =
    (setConsole: SetConsole) =>
    async (dispatch: AppThunkDispatch): Promise<void> => {
        const state = store.getState();
        const projectUid = state.ProjectsReducer.activeProjectUid;
        const project = projectUid
            ? state.ProjectsReducer.projects[projectUid]
            : undefined;
        const documentUid =
            project && getSelectedTargetDocumentUid(project.projectUid)(state);
        const document = documentUid && project?.documents[documentUid];
        if (!project || !document || !/\.(csd|orc)$/i.test(document.filename)) {
            dispatch(
                openSnackbar(
                    "Render error: select a CSD or ORC target",
                    SnackbarType.Error
                )
            );
            return;
        }
        try {
            await runPerformance({
                projectUid: project.projectUid,
                csdPath: /\.csd$/i.test(document.filename)
                    ? documentPath(document, project.documents)
                    : undefined,
                orc: document.currentValue,
                mode: "render",
                setConsole
            });
            dispatch(
                openSnackbar(
                    `Render of ${document.filename} done`,
                    SnackbarType.Success
                )
            );
        } catch (error) {
            dispatch(
                openSnackbar(
                    error instanceof Error ? error.message : "Render failed",
                    SnackbarType.Error
                )
            );
        }
    };

export const listAvailableOpcodes = async (): Promise<void> => {
    let lib: Awaited<ReturnType<typeof libcsound>> | undefined;
    try {
        lib = await libcsound();
    } catch {
        store.dispatch(
            openSnackbar("Failed to load Csound library", SnackbarType.Error)
        );
        return;
    }

    const csound = lib.csoundCreate();
    const factory = lib.csoundUgenFactoryNew(csound);
    const rawOpcodes = lib.csoundUgenListOpcodes(factory);
    lib.csoundUgenFactoryDelete(factory);
    lib.csoundDestroy(csound);

    if (!rawOpcodes || rawOpcodes.length === 0) {
        store.dispatch(
            openSnackbar(
                "No opcodes returned from Csound library",
                SnackbarType.Warning
            )
        );
        return;
    }

    store.dispatch(openSimpleModal("opcode-list", { opcodes: rawOpcodes }));
};
