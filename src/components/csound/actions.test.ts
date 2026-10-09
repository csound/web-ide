import {
    playProject,
    projectPlayback,
    stopProjectPlayback
} from "../target-controls/playback";
import {
    setPlaylistIndex,
    updateAllTargetsLocally
} from "../target-controls/actions";
import { pauseCsound, resumePausedCsound } from "./actions";
import { playListItem } from "../profile/actions";
import * as projectActions from "../projects/actions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Csound } from "@csound/browser";
import { store } from "../../store";
import {
    isCsoundBusy,
    getLiveCsound,
    outputNameFromCsd,
    runPerformance,
    runPerformanceBatch,
    stopCsound,
    stopPerformance
} from "./actions";
import { readWave } from "./wave-files";
import { nonCloudFiles } from "../file-tree/actions";
import { storeProjectEditorKeyboardCallbacks } from "../hot-keys/actions";
import { keyboardCallbacks } from "../hot-keys";
import { consoleReadline } from "../console/readline";

vi.mock("@csound/browser", () => ({ Csound: vi.fn(), libcsound: vi.fn() }));

const source =
    "<CsoundSynthesizer>\n<CsOptions>-odac</CsOptions>\n</CsoundSynthesizer>";
let engine: any;
let writes: Map<string, Uint8Array>;
let listeners: Map<string, (...args: any[]) => void>;
let options: string[];
const setConsole = vi.fn();

beforeEach(() => {
    writes = new Map();
    listeners = new Map();
    options = [];
    nonCloudFiles.clear();
    store.dispatch({
        type: "PROJECTS.UNSET_PROJECT",
        projectUid: "audio-test"
    });
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [
            {
                projectUid: "audio-test",
                documents: {
                    folder: {
                        documentUid: "folder",
                        type: "folder",
                        filename: "scores",
                        path: []
                    },
                    csd: {
                        documentUid: "csd",
                        type: "txt",
                        filename: "piece.csd",
                        currentValue: source,
                        path: ["folder"]
                    }
                }
            }
        ]
    });
    store.dispatch({
        type: "PROJECTS.ACTIVATE_PROJECT",
        projectUid: "audio-test"
    });
    store.dispatch({ type: "CSOUND.SET_CSOUND_PLAY_STATE", status: "stopped" });
    engine = {
        fs: {
            mkdir: vi.fn(),
            writeFile: vi.fn(async (name, bytes) => writes.set(name, bytes)),
            readdir: vi.fn(async () => [...writes.keys()]),
            readFile: vi.fn(async (name) => writes.get(name))
        },
        setOption: vi.fn(async (option) => options.push(option)),
        compileCSD: vi.fn(async (path) => (writes.has(path) ? 0 : -1)),
        compileOrc: vi.fn(async () => 0),
        getSr: vi.fn(async () => 44100),
        getNchnls: vi.fn(async () => 2),
        get0dBFS: vi.fn(async () => 1),
        isRequestingRtAudioInput: vi.fn(async () => 0),
        isRequestingRtMidiInput: vi.fn(async () => 0),
        enableAudioInput: vi.fn(async () => undefined),
        start: vi.fn(async () => {
            if (options.at(-1) !== "-odac") {
                writes.set("piece.wav", new Uint8Array([82, 73, 70, 70]));
                queueMicrotask(() => listeners.get("renderEnded")?.());
            }
            return 0;
        }),
        performKsmps: vi.fn(async () => {
            writes.set("piece.wav", new Uint8Array([82, 73, 70, 70]));
            return 1;
        }),
        cleanup: vi.fn(async () => undefined),
        reset: vi.fn(async () => undefined),
        terminateInstance: vi.fn(async () => undefined),
        stop: vi.fn(async () => undefined),
        pause: vi.fn(async () =>
            listeners.get("realtimePerformancePaused")?.()
        ),
        resume: vi.fn(async () =>
            listeners.get("realtimePerformanceResumed")?.()
        ),
        readlineSubmit: vi.fn(async () => 0),
        off: vi.fn((name) => listeners.delete(name)),
        on: vi.fn((name, callback) => listeners.set(name, callback)),
        once: vi.fn((name, callback) => listeners.set(name, callback))
    };
    vi.mocked(Csound).mockResolvedValue(engine);
});

afterEach(async () => {
    await stopPerformance();
    localStorage.removeItem("sab");
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe("shared Csound performance", () => {
    it.each(["pause", "stop"] as const)(
        "terminates a worker that never acknowledges %s",
        async (method) => {
            await runPerformance({
                projectUid: "audio-test",
                orc: "",
                setConsole
            });
            vi.useFakeTimers();
            try {
                engine[method].mockImplementationOnce(
                    () => new Promise(() => {})
                );
                if (method === "pause") store.dispatch(pauseCsound());
                const stopping = stopPerformance("audio-test");
                await vi.advanceTimersByTimeAsync(2000);
                await stopping;
                expect(engine.cleanup).not.toHaveBeenCalled();
                expect(engine.terminateInstance).toHaveBeenCalledOnce();
                expect(isCsoundBusy()).toBe(false);
                expect(store.getState().csound.status).toBe("stopped");
            } finally {
                vi.useRealTimers();
            }
            await runPerformance({
                projectUid: "audio-test",
                orc: "",
                setConsole
            });
            expect(store.getState().csound.status).toBe("playing");
        }
    );

    it("ignores repeated SAB pause/resume reports that contradict the latest control", async () => {
        await runPerformance({ projectUid: "audio-test", orc: "", setConsole });
        store.dispatch(pauseCsound());
        await vi.waitFor(() => expect(engine.pause).toHaveBeenCalledOnce());
        const dispatch = vi.spyOn(store, "dispatch");
        for (let i = 0; i < 100; i++) {
            listeners.get("realtimePerformanceResumed")?.();
            expect(store.getState().csound.status).toBe("paused");
            listeners.get("realtimePerformancePaused")?.();
        }
        expect(dispatch).not.toHaveBeenCalled();
        store.dispatch(resumePausedCsound());
        await vi.waitFor(() => expect(engine.resume).toHaveBeenCalledOnce());
        dispatch.mockClear();
        for (let i = 0; i < 100; i++) {
            listeners.get("realtimePerformancePaused")?.();
            expect(store.getState().csound.status).toBe("playing");
            listeners.get("realtimePerformanceResumed")?.();
        }
        expect(dispatch).not.toHaveBeenCalled();
        await stopPerformance();
        expect(store.getState().csound.status).toBe("stopped");
    });

    it("keeps the latest pause choice while earlier transport calls finish", async () => {
        await runPerformance({ projectUid: "audio-test", orc: "", setConsole });
        let release!: () => void;
        const calls: string[] = [];
        engine.pause
            .mockImplementationOnce(() => {
                calls.push("pause");
                return new Promise<void>((resolve) => {
                    release = resolve;
                });
            })
            .mockImplementationOnce(async () => {
                calls.push("pause");
                listeners.get("realtimePerformancePaused")?.();
            });
        engine.resume.mockImplementationOnce(async () => {
            calls.push("resume");
            listeners.get("realtimePerformanceResumed")?.();
            expect(store.getState().csound.status).toBe("paused");
        });
        store.dispatch(pauseCsound());
        store.dispatch(resumePausedCsound());
        store.dispatch(pauseCsound());
        expect(calls).toEqual(["pause"]);
        release();
        await vi.waitFor(() =>
            expect(calls).toEqual(["pause", "resume", "pause"])
        );
        expect(store.getState().csound.status).toBe("paused");
    });

    it("waits for a pending pause before stopping the engine", async () => {
        await runPerformance({ projectUid: "audio-test", orc: "", setConsole });
        let paused!: () => void;
        engine.pause.mockImplementationOnce(
            () =>
                new Promise<void>((resolve) => {
                    paused = resolve;
                })
        );
        store.dispatch(pauseCsound());
        const stopping = stopPerformance("audio-test");
        await Promise.resolve();
        expect(engine.stop).not.toHaveBeenCalled();
        paused();
        await stopping;
        expect(engine.stop).toHaveBeenCalledOnce();
        expect(engine.terminateInstance).toHaveBeenCalledOnce();
        expect(store.getState().csound.status).toBe("stopped");
        listeners.get("realtimePerformancePaused")?.();
        expect(store.getState().csound.status).toBe("stopped");
    });

    it("plays an in-memory example and sample without changing project files or collecting output", async () => {
        const onEnded = vi.fn();
        engine.compileCSD.mockResolvedValue(0);
        const documents =
            store.getState().ProjectsReducer.projects["audio-test"].documents;
        await runPerformance({
            projectUid: "audio-test",
            csdText: source,
            mode: "play",
            collectFiles: false,
            inputFiles: [
                { name: "sample.wav", data: new Uint8Array([1, 2, 3]) }
            ],
            setConsole,
            onEnded
        });
        expect(engine.compileCSD).toHaveBeenCalledWith(source, 1);
        expect(writes.get("sample.wav")).toEqual(new Uint8Array([1, 2, 3]));
        writes.set("generated.wav", new Uint8Array([1, 2, 3]));
        listeners.get("realtimePerformanceEnded")?.();
        await vi.waitFor(() => expect(onEnded).toHaveBeenCalledOnce());
        expect(nonCloudFiles.size).toBe(0);
        expect(
            store.getState().ProjectsReducer.projects["audio-test"].documents
        ).toBe(documents);
    });
    it.each(["auto", "render"] as const)(
        "runs an embed in %s mode without storage or SAB",
        async (mode) => {
            const storage = vi
                .spyOn(Storage.prototype, "getItem")
                .mockImplementation(() => {
                    throw new DOMException(
                        "Third-party storage blocked",
                        "SecurityError"
                    );
                });
            try {
                await runPerformance({
                    projectUid: "audio-test",
                    csdPath: "scores/piece.csd",
                    mode,
                    useSAB: false,
                    setConsole
                });
                expect(Csound).toHaveBeenCalledWith({
                    useWorker: mode === "render",
                    useSAB: false
                });
                expect(storage).not.toHaveBeenCalled();
            } finally {
                storage.mockRestore();
            }
        }
    );

    it("pauses and resumes the same performance through the keyboard callback", async () => {
        await runPerformance({ projectUid: "audio-test", orc: "", setConsole });
        storeProjectEditorKeyboardCallbacks("audio-test", setConsole);
        const pause = keyboardCallbacks.get("pause_playback");
        await pause(new KeyboardEvent("keydown", { key: "p" }));
        expect(engine.pause).toHaveBeenCalledOnce();
        expect(store.getState().csound.status).toBe("paused");
        await pause(new KeyboardEvent("keydown", { key: "p" }));
        expect(engine.resume).toHaveBeenCalledOnce();
        expect(store.getState().csound.status).toBe("playing");
        expect(Csound).toHaveBeenCalledOnce();
    });

    it("runs from the keyboard with the console writer and resumes without restarting", async () => {
        storeProjectEditorKeyboardCallbacks("audio-test", setConsole);
        const run = keyboardCallbacks.get("run_project");
        await run(new KeyboardEvent("keydown", { key: "r" }));
        await vi.waitFor(() => expect(engine.start).toHaveBeenCalledOnce());
        expect(setConsole).toHaveBeenCalledWith([""]);
        await run(new KeyboardEvent("keydown", { key: "r" }));
        expect(Csound).toHaveBeenCalledOnce();
        expect(setConsole).toHaveBeenCalledTimes(1);
        store.dispatch({
            type: "CSOUND.SET_CSOUND_PLAY_STATE",
            status: "paused"
        });
        await run(new KeyboardEvent("keydown", { key: "r" }));
        expect(engine.resume).toHaveBeenCalledOnce();
        expect(Csound).toHaveBeenCalledOnce();
    });

    it.each(["stopped", "initialized", "loading", "rendering", "error"])(
        "ignores the pause shortcut while %s",
        (status) => {
            store.dispatch({ type: "CSOUND.SET_CSOUND_PLAY_STATE", status });
            storeProjectEditorKeyboardCallbacks("audio-test", setConsole);
            keyboardCallbacks.get("pause_playback")(
                new KeyboardEvent("keydown", { key: "p" })
            );
            expect(store.getState().csound.status).toBe(status);
            expect(engine.pause).not.toHaveBeenCalled();
        }
    );

    it("listens for readline before startup and clears pending input immediately on stop", async () => {
        engine.start.mockImplementation(async () => {
            listeners.get("readline")?.({ requestId: 1, prompt: "" });
            return 0;
        });
        await runPerformance({ projectUid: "audio-test", orc: "", setConsole });
        expect(consoleReadline.getSnapshot().request).toMatchObject({
            requestId: 1,
            prompt: ""
        });
        consoleReadline.setDraft("first\nsecond");
        consoleReadline.submit();
        await vi.waitFor(() =>
            expect(consoleReadline.getSnapshot().queued).toBe(1)
        );
        let finishStop!: () => void;
        engine.stop.mockImplementation(
            () =>
                new Promise<void>((resolve) => {
                    finishStop = resolve;
                })
        );
        const stopping = stopPerformance();
        expect(consoleReadline.getSnapshot()).toMatchObject({
            request: null,
            queued: 0,
            draft: ""
        });
        finishStop();
        await stopping;
        expect(engine.readlineSubmit).toHaveBeenCalledExactlyOnceWith(
            1,
            "first"
        );
    });

    it.each([false, true])(
        "prepares requested microphone input before starting (worker: %s)",
        async (useWorker) => {
            localStorage.setItem("sab", String(useWorker));
            const inputSource = source.replace("-odac", "-odac -iadc");
            store.dispatch({
                type: "PROJECTS.DOCUMENT_UPDATE_VALUE",
                projectUid: "audio-test",
                documentUid: "csd",
                val: inputSource
            });
            engine.compileCSD.mockImplementation(async () => {
                engine.isRequestingRtAudioInput.mockResolvedValue(1);
                return 0;
            });
            let allowMicrophone!: () => void;
            engine.enableAudioInput.mockReturnValue(
                new Promise<void>((resolve) => {
                    allowMicrophone = resolve;
                })
            );
            const playing = runPerformance({
                projectUid: "audio-test",
                csdPath: "scores/piece.csd",
                setConsole
            });
            try {
                await vi.waitFor(() =>
                    expect(engine.enableAudioInput).toHaveBeenCalledOnce()
                );
                expect(engine.start).not.toHaveBeenCalled();
                expect(store.getState().csound.status).toBe("loading");
            } finally {
                allowMicrophone();
                await playing;
            }
            expect(Csound).toHaveBeenCalledWith({ useWorker });
            expect(engine.compileCSD).toHaveBeenCalledWith(
                "scores/piece.csd",
                0
            );
            expect(
                new TextDecoder().decode(writes.get("scores/piece.csd"))
            ).toBe(inputSource);
            expect(engine.start).toHaveBeenCalledOnce();
            expect(store.getState().csound.status).toBe("playing");
        }
    );

    it("uses the input query for orchestra startup too", async () => {
        engine.isRequestingRtAudioInput.mockResolvedValue(1);
        await runPerformance({ projectUid: "audio-test", orc: "", setConsole });
        expect(engine.enableAudioInput).toHaveBeenCalledOnce();
        expect(engine.start).toHaveBeenCalledOnce();
    });

    it.each(["-odac", "-odac -i samples/adc.wav"])(
        "does not request a microphone when Csound reports no live input (%s)",
        async (flags) => {
            store.dispatch({
                type: "PROJECTS.DOCUMENT_UPDATE_VALUE",
                projectUid: "audio-test",
                documentUid: "csd",
                val: source.replace("-odac", flags)
            });
            await runPerformance({
                projectUid: "audio-test",
                csdPath: "scores/piece.csd",
                setConsole
            });
            expect(engine.isRequestingRtAudioInput).toHaveBeenCalledOnce();
            expect(engine.enableAudioInput).not.toHaveBeenCalled();
            expect(engine.start).toHaveBeenCalledOnce();
        }
    );

    it("cleans up and reports microphone permission errors before startup", async () => {
        engine.isRequestingRtAudioInput.mockResolvedValue(1);
        const denied = new DOMException("Permission denied", "NotAllowedError");
        engine.enableAudioInput.mockRejectedValue(denied);
        await expect(
            runPerformance({
                projectUid: "audio-test",
                csdPath: "scores/piece.csd",
                setConsole
            })
        ).rejects.toMatchObject({
            message: expect.stringContaining(
                "Could not start microphone input"
            ),
            cause: denied
        });
        expect(engine.start).not.toHaveBeenCalled();
        expect(engine.terminateInstance).toHaveBeenCalledOnce();
        expect(store.getState().csound.status).toBe("error");
        expect(isCsoundBusy()).toBe(false);
    });

    it.each(["isRequestingRtAudioInput", "enableAudioInput"])(
        "cancels while %s is pending without starting audio later",
        async (pendingCall) => {
            engine.isRequestingRtAudioInput.mockResolvedValue(1);
            let complete!: (value: number) => void;
            engine[pendingCall].mockReturnValue(
                new Promise<number>((resolve) => {
                    complete = resolve;
                })
            );
            const playing = runPerformance({
                projectUid: "audio-test",
                csdPath: "scores/piece.csd",
                setConsole
            });
            const rejection = expect(playing).rejects.toMatchObject({
                name: "AbortError"
            });
            await vi.waitFor(() =>
                expect(engine[pendingCall]).toHaveBeenCalledOnce()
            );
            await stopPerformance();
            await rejection;
            complete(1);
            await Promise.resolve();
            expect(engine.start).not.toHaveBeenCalled();
            expect(engine.terminateInstance).toHaveBeenCalledOnce();
            expect(store.getState().csound.status).toBe("stopped");
            expect(isCsoundBusy()).toBe(false);
        }
    );

    it.each([
        ["auto", "-odac1"],
        ["auto", "-o dac2"],
        ["play", "--output=dac12"],
        ["play", "--output dac:device"]
    ] as const)(
        "plays rather than renders in %s mode with %s",
        async (mode, output) => {
            store.dispatch({
                type: "PROJECTS.DOCUMENT_UPDATE_VALUE",
                projectUid: "audio-test",
                documentUid: "csd",
                val: source.replace("-odac", output)
            });
            expect(
                await runPerformance({
                    projectUid: "audio-test",
                    csdPath: "scores/piece.csd",
                    mode,
                    setConsole
                })
            ).toEqual({ status: "playing", files: [] });
            expect(options.at(-1)).toBe("-odac");
            expect(nonCloudFiles.size).toBe(0);
        }
    );

    it.each(["dac1.wav", "audio/dac2", "a score.wav"])(
        "keeps file output %s",
        (filename) => {
            expect(
                outputNameFromCsd(`<CsOptions>-o "${filename}"</CsOptions>`)
            ).toBe(filename);
        }
    );

    it("keeps the UI busy until Stop finishes cleanup and termination", async () => {
        let finishCleanup!: () => void;
        let finishTermination!: () => void;
        const cleanup = new Promise<void>((resolve) => {
            finishCleanup = resolve;
        });
        const termination = new Promise<void>((resolve) => {
            finishTermination = resolve;
        });
        engine.cleanup.mockReturnValue(cleanup);
        engine.terminateInstance.mockReturnValue(termination);
        await runPerformance({
            projectUid: "audio-test",
            csdPath: "scores/piece.csd",
            setConsole
        });
        const stopping = store.dispatch(stopCsound());
        try {
            await vi.waitFor(() =>
                expect(engine.cleanup).toHaveBeenCalledOnce()
            );
            expect(store.getState().csound.status).toBe("playing");
            expect(isCsoundBusy()).toBe(true);
            expect(getLiveCsound("audio-test")).toBeUndefined();
            finishCleanup();
            await vi.waitFor(() =>
                expect(engine.terminateInstance).toHaveBeenCalledOnce()
            );
            expect(store.getState().csound.status).toBe("playing");
            expect(isCsoundBusy()).toBe(true);
        } finally {
            finishCleanup();
            finishTermination();
            await stopping;
            await stopPerformance();
        }
        expect(store.getState().csound.status).toBe("stopped");
        expect(isCsoundBusy()).toBe(false);
        await expect(
            runPerformance({
                projectUid: "audio-test",
                csdPath: "scores/piece.csd",
                setConsole
            })
        ).resolves.toMatchObject({ status: "playing" });
    });

    it("syncs current source at nested paths and waits for the rendered file", async () => {
        const result = await runPerformance({
            projectUid: "audio-test",
            csdPath: "scores/piece.csd",
            mode: "render",
            setConsole
        });
        expect(engine.compileCSD).toHaveBeenCalledWith("scores/piece.csd", 0);
        expect(new TextDecoder().decode(writes.get("scores/piece.csd"))).toBe(
            source
        );
        expect(options.at(-1)).toBe("-opiece.wav");
        expect(result).toEqual({ status: "completed", files: ["piece.wav"] });
        expect(nonCloudFiles.get("piece.wav")?.buffer.length).toBe(4);
        expect(engine.terminateInstance).toHaveBeenCalledOnce();
        expect(engine.enableAudioInput).not.toHaveBeenCalled();
        expect(isCsoundBusy()).toBe(false);
    });

    it("supports browser backends without a cleanup method", async () => {
        delete engine.cleanup;
        const result = await runPerformance({
            projectUid: "audio-test",
            csdPath: "scores/piece.csd",
            mode: "render",
            setConsole
        });
        expect(result.status).toBe("completed");
    });

    it("rejects performance errors and keeps partial files out of the tree", async () => {
        engine.start.mockImplementation(async () => {
            writes.set("piece.wav", new Uint8Array([1]));
            listeners.get("message")?.("1 errors in performance");
            queueMicrotask(() => listeners.get("renderEnded")?.());
            return 0;
        });
        await expect(
            runPerformance({
                projectUid: "audio-test",
                csdPath: "scores/piece.csd",
                mode: "render",
                setConsole
            })
        ).rejects.toThrow("performance error");
        expect(nonCloudFiles.size).toBe(0);
        expect(store.getState().csound.status).toBe("error");
    });

    it.each(["wav", "ogg", "mp3"] as const)(
        "renders %s with overrides while leaving the source unchanged",
        async (format) => {
            const original =
                store.getState().ProjectsReducer.projects["audio-test"]
                    .documents.csd.currentValue;
            delete engine.cleanup;
            engine.reset.mockImplementation(async () => {
                writes.set(
                    `csound-export.${format}`,
                    new Uint8Array([1, 2, 3, 4, 5, 6])
                );
            });
            engine.start.mockImplementation(async () => {
                queueMicrotask(() => listeners.get("renderEnded")?.());
                return 0;
            });
            const result = await runPerformance({
                projectUid: "audio-test",
                csdPath: "scores/piece.csd",
                mode: "render",
                setConsole,
                renderSettings: {
                    filename: "dac recording",
                    format,
                    bitDepth: "24",
                    quality: 0.9,
                    sampleRate: 44100,
                    ksmps: 1
                }
            });
            expect(result.files).toEqual([`dac recording.${format}`]);
            expect(engine.reset).toHaveBeenCalledOnce();
            expect(options).toContain("--sample-rate=44100");
            expect(options).toContain("--ksmps=1");
            expect(options).toContain(
                format === "wav"
                    ? "--format=raw:24bit"
                    : format === "ogg"
                      ? "--ogg"
                      : "--mpeg"
            );
            const compiledSource = new TextDecoder().decode(
                writes.get("scores/piece.csd")
            );
            expect(compiledSource).toContain("--ksmps=1");
            expect(
                store.getState().ProjectsReducer.projects["audio-test"]
                    .documents.csd.currentValue
            ).toBe(original);
            const buffer = nonCloudFiles.get(`dac recording.${format}`)!.buffer;
            expect(format === "wav" ? readWave(buffer).data : buffer).toEqual(
                new Uint8Array([1, 2, 3, 4, 5, 6])
            );
        }
    );

    it("rejects invalid render settings before starting the engine", async () => {
        await expect(
            runPerformance({
                projectUid: "audio-test",
                csdPath: "scores/piece.csd",
                mode: "render",
                setConsole,
                renderSettings: {
                    filename: "../file",
                    format: "wav",
                    bitDepth: "24",
                    quality: 0.6
                }
            })
        ).rejects.toThrow("filename");
        expect(Csound).not.toHaveBeenCalled();
    });

    it.each(["isRequestingRtAudioInput", "isRequestingRtMidiInput"])(
        "rejects offline rendering with %s instead of waiting forever",
        async (method) => {
            engine[method].mockResolvedValue(1);
            await expect(
                runPerformance({
                    projectUid: "audio-test",
                    csdPath: "scores/piece.csd",
                    mode: "render",
                    setConsole
                })
            ).rejects.toThrow("Offline rendering cannot use live");
            expect(engine.start).not.toHaveBeenCalled();
            expect(engine.terminateInstance).toHaveBeenCalledOnce();
            expect(nonCloudFiles.size).toBe(0);
        }
    );

    it("reports compile failures without starting or publishing files", async () => {
        engine.compileCSD.mockResolvedValue(1);
        await expect(
            runPerformance({
                projectUid: "audio-test",
                csdPath: "scores/piece.csd",
                mode: "render",
                setConsole
            })
        ).rejects.toThrow("compilation failed");
        expect(engine.start).not.toHaveBeenCalled();
        expect(nonCloudFiles.size).toBe(0);
        expect(store.getState().csound.status).toBe("error");
        expect(isCsoundBusy()).toBe(false);
    });

    it("cancels during engine loading and rejects overlapping starts", async () => {
        let resolve!: (engine: any) => void;
        vi.mocked(Csound).mockReturnValueOnce(
            new Promise((r) => {
                resolve = r;
            })
        );
        const first = runPerformance({
            projectUid: "audio-test",
            csdPath: "scores/piece.csd",
            mode: "render",
            setConsole
        });
        const rejection = expect(first).rejects.toMatchObject({
            name: "AbortError"
        });
        await expect(
            runPerformance({
                projectUid: "audio-test",
                csdPath: "scores/piece.csd",
                setConsole
            })
        ).rejects.toThrow("busy");
        const stopped = stopPerformance();
        resolve(engine);
        await rejection;
        await stopped;
        expect(engine.start).not.toHaveBeenCalled();
        expect(store.getState().csound.status).toBe("stopped");
    });

    it("cancels long renders without publishing partial audio", async () => {
        engine.start.mockImplementation(async () => {
            writes.set("piece.wav", new Uint8Array([1]));
            return 0;
        });
        const rendering = runPerformance({
            projectUid: "audio-test",
            csdPath: "scores/piece.csd",
            mode: "render",
            setConsole
        });
        const rejection = expect(rendering).rejects.toMatchObject({
            name: "AbortError"
        });
        await new Promise((resolve) => setTimeout(resolve, 5));
        await stopPerformance();
        await rejection;
        expect(nonCloudFiles.size).toBe(0);
        expect(engine.terminateInstance).toHaveBeenCalledOnce();
    });

    it("stops realtime audio after play has returned", async () => {
        expect(
            await runPerformance({
                projectUid: "audio-test",
                csdPath: "scores/piece.csd",
                mode: "play",
                setConsole
            })
        ).toMatchObject({ status: "playing" });
        expect(isCsoundBusy()).toBe(true);
        expect(getLiveCsound("audio-test")).toBe(engine);
        expect(getLiveCsound("other-project")).toBeUndefined();
        await stopPerformance();
        expect(engine.stop).toHaveBeenCalledOnce();
        expect(isCsoundBusy()).toBe(false);
        expect(getLiveCsound("audio-test")).toBeUndefined();
    });
});

describe("project playlists", () => {
    it.each(["loading", "playing"])(
        "keeps %s playback when saved settings select the fallback file",
        async (phase) => {
            updateAllTargetsLocally(store.dispatch, "", "audio-test", {});
            let resolveFactory!: (value: any) => void;
            vi.mocked(Csound).mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFactory = resolve;
                    })
            );
            const pending = playProject("audio-test", setConsole);
            if (phase === "playing") {
                resolveFactory(engine);
                await pending;
            }
            // Files can arrive before the saved target's Firestore snapshot.
            updateAllTargetsLocally(store.dispatch, "Main", "audio-test", {
                Main: {
                    targetName: "Main",
                    targetType: "main",
                    targetDocumentUid: "csd",
                    csoundOptions: {}
                }
            });
            resolveFactory(engine);
            await pending;
            expect(engine.start).toHaveBeenCalledOnce();
            expect(store.getState().csound.status).toBe("playing");
            expect(projectPlayback()?.documentUid).toBe("csd");
            expect(engine.stop).not.toHaveBeenCalled();
        }
    );
    const configurePlaylist = (index = 0) => {
        const project = store.getState().ProjectsReducer.projects["audio-test"];
        store.dispatch({
            type: "PROJECTS.UNSET_PROJECT",
            projectUid: "audio-test"
        });
        store.dispatch({
            type: "PROJECTS.STORE_PROJECT_LOCALLY",
            projects: [
                {
                    ...project,
                    documents: {
                        ...project.documents,
                        second: {
                            documentUid: "second",
                            type: "txt",
                            filename: "second.orc",
                            path: [],
                            currentValue: "instr 1\nendin"
                        },
                        third: {
                            documentUid: "third",
                            type: "txt",
                            filename: "last.csd",
                            path: [],
                            currentValue: source
                        }
                    }
                }
            ]
        });
        updateAllTargetsLocally(store.dispatch, "Playlist", "audio-test", {
            Playlist: {
                targetName: "Playlist",
                targetType: "playlist",
                playlistDocumentsUid: ["csd", "second", "third"],
                csoundOptions: {}
            }
        });
        store.dispatch(setPlaylistIndex("audio-test", index));
    };
    it.each(["file", "mode"])(
        "cancels startup when saved settings change the playback %s",
        async (change) => {
            configurePlaylist();
            updateAllTargetsLocally(store.dispatch, "", "audio-test", {});
            let resolveFactory!: (value: any) => void;
            vi.mocked(Csound).mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFactory = resolve;
                    })
            );
            const pending = playProject("audio-test", setConsole);
            updateAllTargetsLocally(store.dispatch, "Saved", "audio-test", {
                Saved: {
                    targetName: "Saved",
                    targetType: change === "mode" ? "playlist" : "main",
                    targetDocumentUid: "third",
                    playlistDocumentsUid: ["csd"],
                    csoundOptions: {}
                }
            });
            resolveFactory(engine);
            await pending;
            expect(engine.start).not.toHaveBeenCalled();
            expect(projectPlayback()).toBeUndefined();
        }
    );
    it("plays in order after cleanup, follows the current track, and resets after the last", async () => {
        configurePlaylist();
        await playProject("audio-test", setConsole);
        expect(engine.compileCSD).toHaveBeenLastCalledWith(
            "scores/piece.csd",
            0
        );
        listeners.get("realtimePerformanceEnded")?.();
        await vi.waitFor(() =>
            expect(engine.compileOrc).toHaveBeenCalledOnce()
        );
        expect(engine.terminateInstance).toHaveBeenCalledOnce();
        expect(projectPlayback()?.documentUid).toBe("second");
        expect(
            store.getState().TargetControlsReducer["audio-test"]
                .selectedTargetPlaylistIndex
        ).toBe(1);
        await vi.waitFor(() => expect(engine.start).toHaveBeenCalledTimes(2));
        listeners.get("realtimePerformanceEnded")?.();
        await vi.waitFor(() => expect(engine.start).toHaveBeenCalledTimes(3));
        expect(engine.compileCSD).toHaveBeenLastCalledWith("last.csd", 0);
        listeners.get("realtimePerformanceEnded")?.();
        await vi.waitFor(() => expect(projectPlayback()).toBeUndefined());
        expect(
            store.getState().TargetControlsReducer["audio-test"]
                .selectedTargetPlaylistIndex
        ).toBe(0);
    });
    it("starts from the guest's chosen entry and stops without advancing", async () => {
        configurePlaylist(1);
        await playProject("audio-test", setConsole);
        expect(engine.compileCSD).not.toHaveBeenCalled();
        expect(engine.compileOrc).toHaveBeenCalledOnce();
        await stopPerformance();
        listeners.get("realtimePerformanceEnded")?.();
        expect(projectPlayback()).toBeUndefined();
        expect(engine.start).toHaveBeenCalledOnce();
    });
    it("auditions one tab without changing the selected starting point or continuing", async () => {
        configurePlaylist(2);
        await playProject("audio-test", setConsole, "csd");
        expect(projectPlayback()?.playlist).toBe(false);
        listeners.get("realtimePerformanceEnded")?.();
        await vi.waitFor(() => expect(projectPlayback()).toBeUndefined());
        expect(engine.start).toHaveBeenCalledOnce();
        expect(
            store.getState().TargetControlsReducer["audio-test"]
                .selectedTargetPlaylistIndex
        ).toBe(2);
    });
    it("plays file-output CSDs when auditioning a playlist tab", async () => {
        configurePlaylist(2);
        store.dispatch({
            type: "PROJECTS.DOCUMENT_UPDATE_VALUE",
            projectUid: "audio-test",
            documentUid: "csd",
            val: source.replace("-odac", "-opiece.wav")
        });
        await playProject("audio-test", setConsole, "csd");
        expect(options.at(-1)).toBe("-odac");
        expect(nonCloudFiles.size).toBe(0);
        expect(projectPlayback()?.playlist).toBe(false);
        expect(
            store.getState().TargetControlsReducer["audio-test"]
                .selectedTargetPlaylistIndex
        ).toBe(2);
    });
    it("uses realtime output for a main-mode project with file options", async () => {
        updateAllTargetsLocally(store.dispatch, "Main", "audio-test", {
            Main: {
                targetName: "Main",
                targetType: "main",
                targetDocumentUid: "csd",
                csoundOptions: {}
            }
        });
        store.dispatch({
            type: "PROJECTS.DOCUMENT_UPDATE_VALUE",
            projectUid: "audio-test",
            documentUid: "csd",
            val: source.replace("-odac", "-opiece.wav")
        });
        await playProject("audio-test", setConsole);
        expect(options.at(-1)).toBe("-odac");
        expect(nonCloudFiles.size).toBe(0);
        expect(store.getState().csound.status).toBe("playing");
    });
    it.each(["completed", "stopped"])(
        "keeps profile controls on later tracks until %s",
        async (ending) => {
            configurePlaylist(1);
            await playProject("audio-test", setConsole);
            store.dispatch({
                type: "PROFILE.SET_CURRENTLY_PLAYING_PROJECT",
                projectUid: "audio-test"
            });
            listeners.get("realtimePerformanceEnded")?.();
            await vi.waitFor(() =>
                expect(engine.start).toHaveBeenCalledTimes(2)
            );
            expect(
                store.getState().ProfileReducer.currentlyPlayingProject
            ).toBe("audio-test");
            store.dispatch(pauseCsound());
            expect(store.getState().csound.status).toBe("paused");
            expect(
                store.getState().ProfileReducer.currentlyPlayingProject
            ).toBe("audio-test");
            store.dispatch(resumePausedCsound());
            expect(store.getState().csound.status).toBe("playing");
            if (ending === "completed")
                listeners.get("realtimePerformanceEnded")?.();
            else await stopPerformance();
            await vi.waitFor(() => expect(projectPlayback()).toBeUndefined());
            expect(
                store.getState().ProfileReducer.currentlyPlayingProject
            ).toBeUndefined();
        }
    );
    it("pause and resume keep the current entry", async () => {
        configurePlaylist();
        await playProject("audio-test", setConsole);
        store.dispatch(pauseCsound());
        expect(store.getState().csound.status).toBe("paused");
        expect(engine.start).toHaveBeenCalledOnce();
        store.dispatch(resumePausedCsound());
        expect(projectPlayback()?.documentUid).toBe("csd");
    });
    it("does not advance on a performance error", async () => {
        configurePlaylist();
        await playProject("audio-test", setConsole);
        listeners.get("message")?.("PERF ERROR: failed");
        listeners.get("realtimePerformanceEnded")?.();
        await vi.waitFor(() => expect(projectPlayback()).toBeUndefined());
        expect(engine.start).toHaveBeenCalledOnce();
        expect(store.getState().csound.status).toBe("error");
    });
    it("stops if a later file fails to compile", async () => {
        configurePlaylist();
        await playProject("audio-test", setConsole);
        engine.compileOrc.mockResolvedValue(-1);
        listeners.get("realtimePerformanceEnded")?.();
        await vi.waitFor(() => expect(projectPlayback()).toBeUndefined());
        expect(engine.start).toHaveBeenCalledOnce();
        expect(store.getState().csound.status).toBe("error");
    });
    it("keeps the current track when Firestore repeats the same settings", async () => {
        configurePlaylist(1);
        await playProject("audio-test", setConsole);
        const controls = store.getState().TargetControlsReducer["audio-test"];
        updateAllTargetsLocally(
            store.dispatch,
            "Playlist",
            "audio-test",
            structuredClone(controls.targets)
        );
        expect(
            store.getState().TargetControlsReducer["audio-test"]
                .selectedTargetPlaylistIndex
        ).toBe(1);
        expect(projectPlayback()?.documentUid).toBe("second");
        expect(engine.stop).not.toHaveBeenCalled();
    });
    it("cancels an active playlist when its saved settings change", async () => {
        configurePlaylist();
        await playProject("audio-test", setConsole);
        updateAllTargetsLocally(store.dispatch, "Main", "audio-test", {
            Main: {
                targetName: "Main",
                targetType: "main",
                targetDocumentUid: "third",
                csoundOptions: {}
            }
        });
        await vi.waitFor(() => expect(projectPlayback()).toBeUndefined());
        expect(engine.stop).toHaveBeenCalledOnce();
        expect(engine.start).toHaveBeenCalledOnce();
    });
    it("does not advance if engine cleanup fails", async () => {
        configurePlaylist();
        await playProject("audio-test", setConsole);
        const log = vi.spyOn(console, "error").mockImplementation(() => {});
        try {
            engine.cleanup.mockRejectedValue(new Error("cleanup failed"));
            listeners.get("realtimePerformanceEnded")?.();
            await vi.waitFor(() => expect(projectPlayback()).toBeUndefined());
            expect(engine.start).toHaveBeenCalledOnce();
            expect(store.getState().csound.status).toBe("error");
        } finally {
            log.mockRestore();
        }
    });
    it("cancels while loading when leaving the project", async () => {
        configurePlaylist();
        let resolveFactory!: (value: any) => void;
        vi.mocked(Csound).mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    resolveFactory = resolve;
                })
        );
        const pending = playProject("audio-test", setConsole);
        stopProjectPlayback("audio-test");
        resolveFactory(engine);
        await pending;
        expect(engine.start).not.toHaveBeenCalled();
        expect(projectPlayback()).toBeUndefined();
    });
});

describe("batch engine reservation", () => {
    it("blocks other playback between tracks and releases the engine after the job", async () => {
        let continueJob!: () => void;
        const gate = new Promise<void>((resolve) => {
            continueJob = resolve;
        });
        const task = runPerformanceBatch(async (perform) => {
            const options = {
                projectUid: "audio-test",
                csdPath: "scores/piece.csd",
                mode: "render" as const,
                collectFiles: false,
                setConsole
            };
            const result = await perform(options);
            expect(result.audio).toEqual(new Uint8Array([82, 73, 70, 70]));
            expect(nonCloudFiles.size).toBe(0);
            await gate;
            await perform(options);
        }, new AbortController().signal);
        await vi.waitFor(() =>
            expect(engine.terminateInstance).toHaveBeenCalledOnce()
        );
        expect(isCsoundBusy()).toBe(true);
        await expect(
            runPerformance({
                projectUid: "audio-test",
                csdText: source,
                mode: "play",
                setConsole
            })
        ).rejects.toThrow("busy");
        continueJob();
        await task;
        expect(isCsoundBusy()).toBe(false);
        expect(store.getState().csound.status).toBe("stopped");
    });
    it("stop cancels a batch while it is between engines", async () => {
        const task = runPerformanceBatch(async (_perform, signal) => {
            await new Promise<void>((_resolve, reject) =>
                signal.addEventListener("abort", () => reject(signal.reason))
            );
        }, new AbortController().signal);
        const rejected = expect(task).rejects.toThrow();
        await stopPerformance();
        await rejected;
        expect(isCsoundBusy()).toBe(false);
    });
    it("releases a failed reservation and rejects an already-aborted job", async () => {
        await expect(
            runPerformanceBatch(async () => {
                throw new Error("fail");
            }, new AbortController().signal)
        ).rejects.toThrow("fail");
        expect(isCsoundBusy()).toBe(false);
        const task = vi.fn();
        await expect(
            runPerformanceBatch(task, AbortSignal.abort())
        ).rejects.toThrow();
        expect(task).not.toHaveBeenCalled();
    });
});

describe("profile playback switching", () => {
    beforeEach(() => {
        const project = store.getState().ProjectsReducer.projects["audio-test"];
        store.dispatch({
            type: "PROJECTS.STORE_PROJECT_LOCALLY",
            projects: [
                {
                    ...project,
                    projectUid: "other-audio",
                    cachedProjectLastModified: 1
                },
                { ...project, cachedProjectLastModified: 1 }
            ]
        });
        for (const projectUid of ["audio-test", "other-audio"])
            store.dispatch({
                type: "PROJECT_LAST_MODIFIED.UPDATE_PROJECT_LAST_MODIFIED_LOCALLY",
                projectUid,
                timestamp: 1
            });
    });

    it("starts only the latest card when downloads finish out of order", async () => {
        let loaded!: (result: { exists: boolean }) => void;
        vi.spyOn(projectActions, "downloadProjectOnce").mockReturnValueOnce(
            () =>
                new Promise((resolve) => {
                    loaded = resolve;
                })
        );
        const first = store.dispatch(playListItem({ projectUid: "uncached" }));
        await vi.waitFor(() => expect(loaded).toBeDefined());
        await store.dispatch(playListItem({ projectUid: "other-audio" }));
        loaded({ exists: true });
        await first;
        expect(Csound).toHaveBeenCalledOnce();
        expect(projectPlayback()?.projectUid).toBe("other-audio");
    });

    it("does not start a downloaded project after its card unmounts", async () => {
        let loaded!: (result: { exists: boolean }) => void;
        vi.spyOn(projectActions, "downloadProjectOnce").mockReturnValueOnce(
            () =>
                new Promise((resolve) => {
                    loaded = resolve;
                })
        );
        const controller = new AbortController();
        const pending = store.dispatch(
            playListItem({ projectUid: "uncached", signal: controller.signal })
        );
        await vi.waitFor(() => expect(loaded).toBeDefined());
        controller.abort();
        loaded({ exists: true });
        await pending;
        expect(Csound).not.toHaveBeenCalled();
    });

    it("allows retry after a failed start", async () => {
        engine.compileCSD.mockResolvedValueOnce(-1);
        await expect(
            store.dispatch(playListItem({ projectUid: "audio-test" }))
        ).rejects.toThrow("compilation failed");
        await store.dispatch(playListItem({ projectUid: "audio-test" }));
        expect(store.getState().csound.status).toBe("playing");
    });

    it("does not stop a different project's engine during editor cleanup", async () => {
        await store.dispatch(playListItem({ projectUid: "other-audio" }));
        await stopPerformance("audio-test");
        expect(engine.stop).not.toHaveBeenCalled();
        expect(store.getState().csound.status).toBe("playing");
        await stopPerformance("other-audio");
        expect(engine.terminateInstance).toHaveBeenCalledOnce();
        expect(projectPlayback()).toBeUndefined();
    });

    it.each(["playing", "paused"])(
        "switches a %s project and waits for termination",
        async (status) => {
            await store.dispatch(playListItem({ projectUid: "audio-test" }));
            await vi.waitFor(() =>
                expect(store.getState().csound.status).toBe("playing")
            );
            if (status === "paused") store.dispatch(pauseCsound());
            let terminate!: () => void;
            const gate = new Promise<void>((resolve) => {
                terminate = resolve;
            });
            engine.terminateInstance.mockImplementationOnce(() => gate);
            const next = store.dispatch(
                playListItem({ projectUid: "other-audio" })
            );
            try {
                await vi.waitFor(() =>
                    expect(engine.terminateInstance).toHaveBeenCalledOnce()
                );
                expect(Csound).toHaveBeenCalledOnce();
            } finally {
                terminate();
            }
            await next;
            expect(Csound).toHaveBeenCalledTimes(2);
            expect(store.getState().csound.status).toBe("playing");
            expect(
                store.getState().ProfileReducer.currentlyPlayingProject
            ).toBe("other-audio");
        }
    );
});
