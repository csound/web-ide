import { AppThunkDispatch, RootState, store } from "@root/store";
import { IDocument, IProject } from "../projects/types";
import { Csound, libcsound } from "@csound/browser";
import {
    cleanupNonCloudFiles,
    nonCloudFiles,
    addNonCloudFile
} from "@comp/file-tree/actions";
import { openSnackbar } from "@comp/snackbar/actions";
import { openSimpleModal } from "@comp/modal/actions";
import { SnackbarType } from "@comp/snackbar/types";
import {
    CsoundObj,
    ICsoundStatus,
    SET_CSOUND_PLAY_STATE,
    compileCSD
} from "./types";
import { selectActiveProject } from "@comp/projects/selectors";
import { addDocumentToCsoundFS, getUniqueFilename } from "@comp/projects/utils";
import { getSelectedTargetDocumentUid } from "@comp/target-controls/selectors";
import { append, isEmpty, difference } from "ramda";

export let csoundInstance: CsoundObj;

// State management for Web Audio microphone nodes
let microphoneStream: MediaStream | undefined;
let microphoneSourceNode: MediaStreamAudioSourceNode | undefined;
let microphoneProcessingNodes: AudioNode[] = [];
let microphoneConnectInFlight: Promise<void> | undefined;

const cleanupMicrophoneBridge = (): void => {
    microphoneProcessingNodes.forEach((node) => {
        try {
            node.disconnect();
        } catch {}
    });
    microphoneProcessingNodes = [];

    if (microphoneSourceNode) {
        try {
            microphoneSourceNode.disconnect();
        } catch {}
        microphoneSourceNode = undefined;
    }

    if (microphoneStream) {
        microphoneStream.getTracks().forEach((track) => track.stop());
        microphoneStream = undefined;
    }
};

const waitForCsoundInputNode = async (
    csound: CsoundObj,
    retries: number = 10,
    delay: number = 100
): Promise<AudioNode> => {
    for (let i = 0; i < retries; i++) {
        const node = await csound.getNode();
        if (node instanceof AudioNode && node.numberOfInputs > 0) {
            return node;
        }
        await new Promise((r) => setTimeout(r, delay));
    }
    throw new Error("Csound AudioNode timed out or has no input ports.");
};

const connectMicrophoneToCsoundNode = async (
    csound: CsoundObj,
    requestedInputChannels: number
): Promise<void> => {
    const audioContext = await csound.getAudioContext();
    if (!audioContext) throw new Error("No AudioContext found.");
    if (!(audioContext instanceof AudioContext)) {
        throw new Error(
            "Microphone bridge requires a realtime AudioContext, not OfflineAudioContext."
        );
    }

    if (audioContext.state === "suspended") {
        await audioContext.resume();
    }

    const csoundNode = await waitForCsoundInputNode(csound);

    // Tear down any previous bridge before acquiring the new stream
    cleanupMicrophoneBridge();

    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            deviceId: "default",
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: audioContext.sampleRate
        }
    });

    microphoneStream = stream;
    const sourceNode = audioContext.createMediaStreamSource(stream);
    microphoneSourceNode = sourceNode;
    const sourceChannels = sourceNode.channelCount;

    if (requestedInputChannels <= 1) {
        sourceNode.connect(csoundNode, 0, 0);
    } else {
        const merger = audioContext.createChannelMerger(requestedInputChannels);
        const splitter = audioContext.createChannelSplitter(sourceChannels);
        sourceNode.connect(splitter);

        const channelsToRoute = Math.min(
            requestedInputChannels,
            sourceChannels
        );
        for (let i = 0; i < channelsToRoute; i++) {
            splitter.connect(merger, i, i);
        }

        merger.connect(csoundNode, 0, 0);
        microphoneProcessingNodes.push(splitter, merger);
    }
};

const ensureMicrophoneConnected = async (
    csound: CsoundObj,
    channels: number
): Promise<void> => {
    if (microphoneConnectInFlight) return microphoneConnectInFlight;
    microphoneConnectInFlight = connectMicrophoneToCsoundNode(csound, channels);
    try {
        await microphoneConnectInFlight;
    } finally {
        microphoneConnectInFlight = undefined;
    }
};

const installDeterministicMicrophoneBridge = (
    csound: CsoundObj,
    channels: number,
    useWorker: boolean
): void => {
    if (useWorker) return;
    csound.enableAudioInput = async () => {
        await ensureMicrophoneConnected(csound, channels);
    };
};

const hasAdcInputFlagInCsOptions = (csd: string = ""): boolean => {
    const match = csd.match(/<CsOptions>[\s\S]*?<\/CsOptions>/i);
    if (!match) {
        return false;
    }
    const options = match[0].replace(/;.*$/gm, "");
    return (
        /(^|\s)-i\s*(?:"adc"|'adc'|adc)(?=\s|$)/i.test(options) ||
        /(^|\s)--input\s*(?:=\s*)?(?:"adc"|'adc'|adc)(?=\s|$)/i.test(options)
    );
};

const stripAdcInputFlagFromCsOptions = (csd: string = ""): string => {
    if (!csd) {
        return csd;
    }

    return csd.replace(/<CsOptions>[\s\S]*?<\/CsOptions>/i, (block) => {
        return block
            .replace(/(^|\s)-i\s*(?:"adc"|'adc'|adc)(?=\s|$)/gi, "$1")
            .replace(
                /(^|\s)--input\s*(?:=\s*)?(?:"adc"|'adc'|adc)(?=\s|$)/gi,
                "$1"
            )
            .replace(/[ \t]+\n/g, "\n")
            .replace(/[ \t]{2,}/g, " ");
    });
};

const parseOutputNameFromCsOptions = (
    csdContents: string | undefined
): string | undefined => {
    if (typeof csdContents !== "string" || csdContents.length === 0) {
        return undefined;
    }

    const csOptionsMatch = csdContents.match(
        /<CsOptions>([\s\S]*?)<\/CsOptions>/i
    );
    if (!csOptionsMatch || !csOptionsMatch[1]) {
        return undefined;
    }

    const options = csOptionsMatch[1]
        // remove semicolon comments commonly used in Csound options blocks
        .replace(/;.*$/gm, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (options.length === 0) {
        return undefined;
    }

    const outputMatch = options.match(
        /(?:^|\s)(?:-o(?:"([^"]+)"|'([^']+)'|([^\s]+))|--output(?:=|\s+)(?:"([^"]+)"|'([^']+)'|([^\s]+)))/
    );

    const outputName = outputMatch
        ? outputMatch.slice(1).find((value) => typeof value === "string")
        : undefined;

    if (!outputName || outputName === "dac") {
        return undefined;
    }

    return outputName;
};

export const setCsoundPlayState = (
    playState: ICsoundStatus
): { type: typeof SET_CSOUND_PLAY_STATE; status: ICsoundStatus } => {
    return {
        type: SET_CSOUND_PLAY_STATE,
        status: playState
    };
};

export const setCsound = (csound: CsoundObj): void => {
    csound.on("realtimePerformanceEnded", async () => {
        cleanupMicrophoneBridge();
        try {
            await csound.cleanup();
        } catch {}

        store.dispatch(setCsoundPlayState("stopped"));
    });
    csound.on("realtimePerformancePaused", () => {
        store.dispatch(setCsoundPlayState("paused"));
    });

    csound.on("realtimePerformanceResumed", () => {
        store.dispatch(setCsoundPlayState("playing"));
    });

    csound.on("realtimePerformanceStarted", () => {
        store.dispatch(setCsoundPlayState("playing"));
    });
    csound.on("renderStarted", () => {
        store.dispatch(setCsoundPlayState("rendering"));
    });
    csound.on("renderEnded", async () => {
        store.dispatch(setCsoundPlayState("stopped"));
        try {
            await csound.cleanup();
        } catch {}
    });
};

export const syncFs = async (
    csound: CsoundObj,
    projectUid: string,
    storeState: RootState
): Promise<void> => {
    const projectDocuments =
        storeState.ProjectsReducer.projects[projectUid]?.documents;

    if (!projectDocuments || Object.keys(projectDocuments).length === 0) {
        console.warn(
            `No documents found for project ${projectUid}. Documents may not be loaded yet.`
        );
        return;
    }

    const documents: IDocument[] = Object.values(projectDocuments);

    for (const document of documents) {
        // reminder: paths are store by document ref and not
        // the actual filesystem name
        const realPath = document.path.map(
            (documentId: string) =>
                storeState.ProjectsReducer.projects[projectUid].documents[
                    documentId
                ].filename
        );
        const filepath = isEmpty(realPath)
            ? document.filename
            : realPath.join("/") + "/" + document.filename;

        await addDocumentToCsoundFS(projectUid, csound, document, filepath);
    }
};

export const playCsdFromFs = ({
    projectUid,
    csdPath
}: {
    projectUid: string;
    csdPath: string;
}) => {
    return async (dispatch: AppThunkDispatch, setConsole: any) => {
        cleanupMicrophoneBridge();
        const useWorker = localStorage.getItem("sab") === "true";

        const state = store.getState();
        const project = state.ProjectsReducer.projects?.[projectUid];
        const targetDoc = Object.values(project?.documents || {}).find(
            (doc) => doc.filename === csdPath
        );
        const csdContent = targetDoc?.currentValue || "";
        const shouldMapAdcToBrowserInput =
            !useWorker && hasAdcInputFlagInCsOptions(csdContent);
        const csdToCompile = shouldMapAdcToBrowserInput
            ? stripAdcInputFlagFromCsOptions(csdContent)
            : csdContent;

        if (shouldMapAdcToBrowserInput) {
            dispatch(
                openSnackbar(
                    "Input note: -iadc mapped to browser microphone input.",
                    SnackbarType.Info
                )
            );
        }

        const csoundObj = await Csound({
            useWorker
        });

        if (!csoundObj) {
            return;
        }
        csoundInstance = csoundObj;

        setCsound(csoundInstance);
        installDeterministicMicrophoneBridge(csoundObj, 1, useWorker);
        await syncFs(csoundObj, projectUid, store.getState());

        if (csoundObj && setConsole) {
            setConsole([""]);
            csoundObj.on("message", (message: string) =>
                setConsole(append(message + "\n"))
            );
        }

        if (csoundObj) {
            const projectDocuments =
                store.getState().ProjectsReducer.projects?.[projectUid]
                    ?.documents ?? {};
            const targetDoc = Object.values(projectDocuments).find(
                (doc) => doc.filename === csdPath
            );
            const outputFromCsOptions = parseOutputNameFromCsOptions(
                targetDoc?.currentValue
            );
            if (!outputFromCsOptions) {
                await csoundObj.setOption("-odac");
            } else {
                await csoundObj.setOption(`-o${outputFromCsOptions}`);
            }
            const result = shouldMapAdcToBrowserInput
                ? await compileCSD(csoundObj, csdToCompile, true)
                : await compileCSD(csoundObj, csdPath);

            if (result === 0) {
                const filesPre = await csoundObj.fs.readdir("/");
                const outputName = await csoundObj.getOutputName();
                const isDiskRender =
                    typeof outputName === "string" &&
                    outputName.length > 0 &&
                    !outputName.includes("dac");

                const collectPlayableOutputs = async () => {
                    console.log("COLLECT!");
                    const filesPost = await csoundObj.fs.readdir("/");
                    const newFiles = difference(filesPost, filesPre);
                    const normalizedOutputName = outputName.replace(/^\/+/, "");
                    const absoluteOutputName = `/${normalizedOutputName}`;
                    const filesToRead = [
                        ...new Set([
                            ...newFiles,
                            ...(filesPost.includes(normalizedOutputName)
                                ? [normalizedOutputName]
                                : []),
                            ...(filesPost.includes(absoluteOutputName)
                                ? [absoluteOutputName]
                                : [])
                        ])
                    ];
                    return filesToRead;
                };

                const addOutputsToTree = async () => {
                    const filesToRead = new Set<string>(
                        await collectPlayableOutputs()
                    );
                    const existingNames = new Set<string>(
                        Array.from(nonCloudFiles.keys())
                    );
                    for (const filename of await collectPlayableOutputs()) {
                        filesToRead.add(filename);
                    }

                    for (const newFile of filesToRead) {
                        const normalizedName = newFile.replace(/^\/+/, "");
                        const candidatePaths = [
                            newFile,
                            normalizedName,
                            `/${normalizedName}`
                        ];
                        let buffer: Uint8Array | undefined;

                        for (const candidatePath of candidatePaths) {
                            try {
                                buffer =
                                    await csoundObj.fs.readFile(candidatePath);
                                if (buffer) {
                                    break;
                                }
                            } catch {}
                        }

                        if (buffer) {
                            const uniqueName = getUniqueFilename(
                                normalizedName,
                                Array.from(existingNames)
                            );
                            existingNames.add(uniqueName);
                            nonCloudFiles.set(uniqueName, {
                                buffer,
                                createdAt: new Date(),
                                name: uniqueName
                            });
                            dispatch(
                                addNonCloudFile({
                                    createdAt: Date.now(),
                                    name: uniqueName
                                })
                            );
                        }
                    }
                };

                if (isDiskRender) {
                    dispatch(setCsoundPlayState("rendering"));
                    csoundObj.once("renderEnded", async () => {
                        await addOutputsToTree();
                        dispatch(setCsoundPlayState("stopped"));
                        performResult = 1;
                    });
                    const startResult = await csoundObj.start();
                    let performResult = 0;

                    if (startResult !== 0) {
                        dispatch(setCsoundPlayState("error"));
                        return;
                    }

                    while (performResult === 0) {
                        performResult = await csoundObj.performKsmps();
                    }
                } else {
                    csoundObj.once("realtimePerformanceEnded", async () => {
                        await addOutputsToTree();
                    });
                    try {
                        await csoundObj.start();
                        if (!useWorker) {
                            await csoundObj.enableAudioInput();
                        }
                        dispatch(setCsoundPlayState("playing"));
                    } catch (error: unknown) {
                        cleanupMicrophoneBridge();
                        try {
                            await csoundObj.stop();
                        } catch {}
                        try {
                            await csoundObj.cleanup();
                        } catch {}

                        dispatch(setCsoundPlayState("error"));
                        dispatch(
                            openSnackbar(
                                "Audio input error: unable to start microphone input. Check permission settings and browser audio policy.",
                                SnackbarType.Error
                            )
                        );
                        console.error(error);
                    }
                }
            } else {
                try {
                    if (
                        typeof csoundObj === "object" &&
                        typeof csoundObj.cleanup === "function"
                    ) {
                        await csoundObj.cleanup();
                    }
                } catch (error: any) {
                    console.error(error);
                }

                dispatch(setCsoundPlayState("error"));
            }
        }
    };
};

export const playORCFromString = ({
    projectUid,
    orc
}: {
    projectUid: string;
    orc: string;
}): ((dispatch: any, setConsole: any) => Promise<void>) => {
    return async (dispatch, setConsole: any) => {
        const csoundObj = await Csound({
            useWorker: localStorage.getItem("sab") === "true"
        });

        if (!csoundObj) {
            return;
        }

        csoundInstance = csoundObj;

        setCsound(csoundInstance);

        if (csoundObj && setConsole) {
            setConsole([""]);
            csoundObj.on("message", (message: string) =>
                setConsole(append(message + "\n"))
            );
        }

        if (csoundObj) {
            await csoundObj.setOption("-odac");

            const result = await csoundObj.compileOrc(orc);

            if (result === 0) {
                await csoundObj.start();
                dispatch(setCsoundPlayState("playing"));
            } else {
                try {
                    await csoundObj.cleanup();
                } catch (error: any) {
                    console.error(error);
                }

                dispatch(setCsoundPlayState("error"));
            }
        }
    };
};

export const stopCsound = () => {
    cleanupMicrophoneBridge();
    csoundInstance && csoundInstance.stop();
    return setCsoundPlayState("stopped");
};

export const pauseCsound = () => {
    csoundInstance && csoundInstance.pause();
    return setCsoundPlayState("paused");
};

export const resumePausedCsound = () => {
    csoundInstance && csoundInstance.resume();
    return setCsoundPlayState("playing");
};

export const renderToDisk = (
    setConsole: any
): ((dispatch: (store: RootState) => void) => void) => {
    return async (dispatch: any) => {
        const state: RootState = store.getState();
        const project: IProject | undefined = selectActiveProject(state);
        if (project) {
            dispatch(cleanupNonCloudFiles({ projectUid: project.projectUid }));
        }

        if (!project) {
            dispatch(
                openSnackbar(
                    "Render error: no project is currently selected",
                    SnackbarType.Error
                )
            );
            return;
        }

        const targetDocumentUid = getSelectedTargetDocumentUid(
            project.projectUid
        )(state);

        if (!targetDocumentUid) {
            dispatch(
                openSnackbar(
                    "Render error: no target was found for this project",
                    SnackbarType.Error
                )
            );
            return;
        }

        // Non-worker mode has more reliable render lifecycle events for offline -o rendering.
        const csound = await Csound({
            useWorker: false
        });

        csoundInstance = csound as CsoundObj;

        if (!csound) {
            dispatch(
                openSnackbar(
                    "Render error: csound failed to start",
                    SnackbarType.Error
                )
            );
            return;
        }

        setConsole([""]);

        const filesPre = await csound.fs.readdir("/");

        const targetDocument = project.documents[targetDocumentUid];
        const targetDocumentName = targetDocument.filename;
        const defaultOutputName = `${targetDocumentName.split(".")[0]}.wav`;
        const outputFromCsOptions = targetDocumentName.endsWith("csd")
            ? parseOutputNameFromCsOptions(targetDocument.currentValue)
            : undefined;

        // Set output before compilation to ensure Csound picks it up.
        const requestedOutputName = outputFromCsOptions ?? defaultOutputName;
        await csound.setOption(`-o${requestedOutputName}`);

        targetDocumentName.endsWith("csd")
            ? await compileCSD(csound, targetDocumentName)
            : await csound.compileOrc(targetDocument.currentValue);

        // If API does not report output name reliably, fall back to the
        // output option we explicitly requested above.
        const outputNameFromApi = await csound.getOutputName();
        const outputName =
            typeof outputNameFromApi === "string" &&
            outputNameFromApi.length > 0 &&
            outputNameFromApi !== "dac"
                ? outputNameFromApi
                : requestedOutputName;

        const collectRenderableFiles = async (): Promise<string[]> => {
            const filesPost = await csound.fs.readdir("/");
            const newFiles = difference(filesPost, filesPre);
            const normalizedOutputName = outputName.replace(/^\/+/, "");
            const absoluteOutputName = `/${normalizedOutputName}`;
            const filesToRead = [
                ...new Set([
                    ...newFiles,
                    ...(filesPost.includes(normalizedOutputName)
                        ? [normalizedOutputName]
                        : []),
                    ...(filesPost.includes(absoluteOutputName)
                        ? [absoluteOutputName]
                        : [])
                ])
            ];
            return filesToRead;
        };

        let didFinalizeRender = false;
        const finalizeRender = async () => {
            if (didFinalizeRender) {
                return;
            }
            didFinalizeRender = true;

            const filesToRead = new Set<string>(await collectRenderableFiles());
            const existingNames = new Set<string>(
                Array.from(nonCloudFiles.keys())
            );

            try {
                await csound.cleanup();
            } catch {}

            for (const filename of await collectRenderableFiles()) {
                filesToRead.add(filename);
            }

            for (const newFile of filesToRead) {
                const normalizedName = newFile.replace(/^\/+/, "");
                const candidatePaths = [
                    newFile,
                    normalizedName,
                    `/${normalizedName}`
                ];
                let buffer: Uint8Array | undefined;
                for (const candidatePath of candidatePaths) {
                    try {
                        buffer = await csound.fs.readFile(candidatePath);
                        if (buffer) {
                            break;
                        }
                    } catch {}
                }
                if (buffer) {
                    const uniqueName = getUniqueFilename(
                        normalizedName,
                        Array.from(existingNames)
                    );
                    existingNames.add(uniqueName);
                    nonCloudFiles.set(uniqueName, {
                        buffer,
                        createdAt: new Date(),
                        name: uniqueName
                    });
                    dispatch(
                        addNonCloudFile({
                            createdAt: Date.now(),
                            name: uniqueName
                        })
                    );
                }
            }

            try {
                await csound.terminateInstance();
            } catch {}

            dispatch(setCsoundPlayState("stopped"));
            dispatch(
                openSnackbar(
                    `Render of ${targetDocumentName} done`,
                    SnackbarType.Success
                )
            );
        };

        csound.on("message", (message: string) =>
            setConsole(append(message + "\n"))
        );

        dispatch(setCsoundPlayState("rendering"));
        dispatch(
            openSnackbar(
                `Render of ${targetDocumentName} started`,
                SnackbarType.Info
            )
        );
        const result = await csound.start();

        if (result !== 0) {
            void finalizeRender();
            dispatch(
                openSnackbar(
                    "Render error: the project encountered an error while rendering",
                    SnackbarType.Error
                )
            );
            return;
        }

        // Deterministic render path: drive the performance loop ourselves until
        // Csound reports end-of-score (non-zero return).
        let performResult = 0;
        while (performResult === 0 && !didFinalizeRender) {
            performResult = await csound.performKsmps();
        }
        void finalizeRender();

        if (performResult < 0) {
            dispatch(
                openSnackbar(
                    "Render error: performance did not complete successfully",
                    SnackbarType.Error
                )
            );
        }
    };
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
