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
import { consoleReadline } from "../console/readline";
import {
    RenderSettings,
    renderFilename,
    renderOptions,
    validateRenderSettings,
    withPerformanceOptions
} from "./render-settings";

export let csoundInstance: CsoundObj;

type SetConsole = React.Dispatch<React.SetStateAction<string[]>>;
type Run = {
    controller: AbortController;
    done: Promise<void>;
    projectUid: string;
};
let activeRun: Run | undefined;

export const setCsoundPlayState = (status: ICsoundStatus) => ({
    type: SET_CSOUND_PLAY_STATE,
    status
});
export const isCsoundBusy = () => !!activeRun;
export const getLiveCsound = (projectUid: string): CsoundObj | undefined =>
    activeRun?.projectUid === projectUid &&
    !activeRun.controller.signal.aborted &&
    store.getState().csound.status === "playing"
        ? csoundInstance
        : undefined;

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
    // Audition an in-memory CSD without adding it or its output to the project.
    csdText?: string;
    inputFiles?: { name: string; data: Uint8Array }[];
    collectFiles?: boolean;
    onEnded?: (reason: "completed" | "stopped" | "error") => void;
    orc?: string;
    mode?: "auto" | "play" | "render";
    // Embeds must work without cross-origin isolation or stored preferences.
    useSAB?: boolean;
    renderSettings?: RenderSettings;
    signal?: AbortSignal;
    setConsole: SetConsole;
};

// UI and WebMCP share one run and one cancellation path.
export async function runPerformance({
    projectUid,
    csdPath,
    csdText,
    inputFiles = [],
    collectFiles = true,
    onEnded,
    orc,
    mode = "auto",
    useSAB,
    renderSettings,
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
    if (renderSettings) {
        const error = validateRenderSettings(renderSettings);
        if (error) throw new Error(error);
    }
    const render = mode === "render" || (mode === "auto" && !!requestedOutput);
    const outputName =
        (renderSettings ? renderFilename(renderSettings) : undefined) ??
        requestedOutput ??
        `${document?.filename.replace(/\.[^.]+$/, "") ?? "render"}.wav`;
    // The browser engine treats any output path containing "dac" as realtime.
    const engineOutputName = renderSettings
        ? getUniqueFilename(
              `csound-export.${renderSettings.format}`,
              Object.values(project.documents).map((doc) =>
                  documentPath(doc, project.documents)
              )
          )
        : outputName;
    const overrides = [
        ...(renderSettings
            ? renderOptions(renderSettings)
            : !render
              ? ["--format=wav:float"]
              : []),
        render ? `-o${engineOutputName}` : "-odac"
    ];
    const controller = new AbortController();
    let resolveDone!: () => void;
    const run: Run = {
        projectUid,
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
    let disconnectReadline = () => {};
    const finish = (collect: boolean): Promise<string[]> => {
        if (finishPromise) return finishPromise;
        disconnectReadline();
        finishPromise = (async () => {
            const files: string[] = [];
            try {
                if (csound) {
                    // Flush buffered samples and close the encoder before reading.
                    if (csound.cleanup) await csound.cleanup();
                    else if (render) await csound.reset();
                    if (
                        collect &&
                        collectFiles &&
                        !failed &&
                        !controller.signal.aborted &&
                        store.getState().ProjectsReducer.activeProjectUid ===
                            projectUid
                    ) {
                        if (
                            render &&
                            !(await csound.fs.readFile(engineOutputName))
                                ?.length
                        ) {
                            throw new Error(
                                "Csound produced no audio file. Read the console for details."
                            );
                        }
                        const after = await csound.fs.readdir("/");
                        const candidates = new Set([
                            ...(render ? [engineOutputName] : []),
                            ...after.filter((name) => !before.includes(name))
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
                                (name === engineOutputName && render
                                    ? outputName
                                    : name
                                ).replace(/^\/+/, ""),
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
            } catch (error) {
                failed = true;
                throw error;
            } finally {
                try {
                    await csound?.terminateInstance();
                } catch (error) {
                    failed = true;
                    console.error(error);
                } finally {
                    signal?.removeEventListener("abort", cancel);
                    if (activeRun === run) {
                        activeRun = undefined;
                        store.dispatch(
                            setCsoundPlayState(failed ? "error" : "stopped")
                        );
                    }
                    resolveDone();
                    onEnded?.(
                        controller.signal.aborted
                            ? "stopped"
                            : failed || !collect
                              ? "error"
                              : "completed"
                    );
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
            useWorker:
                render || (useSAB ?? localStorage.getItem("sab") === "true"),
            ...(render || useSAB === false ? { useSAB: false } : {})
        })) as CsoundObj | undefined;
        check();
        if (!csound) throw new Error("Csound failed to start.");
        csoundInstance = csound;
        disconnectReadline = consoleReadline.connect(
            csound,
            projectUid,
            (text) => {
                setConsole((lines) => [...lines, text]);
            }
        );
        controller.signal.addEventListener("abort", disconnectReadline, {
            once: true
        });
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
        for (const file of inputFiles) {
            await csound.fs.writeFile(file.name, file.data);
            check();
        }
        before = await csound.fs.readdir("/");
        for (const option of overrides) await csound.setOption(option);
        if (csdPath && document && renderSettings) {
            await csound.fs.writeFile(
                csdPath,
                new TextEncoder().encode(
                    withPerformanceOptions(document.currentValue, overrides)
                )
            );
        }
        const compiled =
            csdText !== undefined
                ? await compileCSD(
                      csound,
                      renderSettings
                          ? withPerformanceOptions(csdText, overrides)
                          : csdText,
                      true
                  )
                : csdPath
                  ? await compileCSD(csound, csdPath)
                  : await csound.compileOrc(orc ?? "");
        check();
        if (compiled !== 0)
            throw new Error(
                "Csound compilation failed. Read the console for details."
            );
        // CsOptions may override the initial command-line options.
        for (const option of overrides) await csound.setOption(option);
        // Live inputs make the browser backend start a realtime thread even
        // with file output, so it would never send the renderEnded event.
        if (
            render &&
            ((await csound.isRequestingRtAudioInput()) ||
                (await csound.isRequestingRtMidiInput()))
        ) {
            throw new Error(
                "Offline rendering cannot use live audio or MIDI input. Remove live input options from CsOptions, or use an input file."
            );
        }
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
        await runPerformance({ projectUid, csdPath, mode: "play", setConsole });
    };
export const playORCFromString =
    ({ projectUid, orc }: { projectUid: string; orc: string }) =>
    async (
        _dispatch: AppThunkDispatch,
        setConsole: SetConsole
    ): Promise<void> => {
        await runPerformance({ projectUid, orc, mode: "play", setConsole });
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
        dispatch(
            openSimpleModal("render-dialog", {
                projectUid: project.projectUid,
                documentUid: document.documentUid,
                setConsole
            })
        );
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
