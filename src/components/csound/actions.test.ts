import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Csound } from "@csound/browser";
import { store } from "../../store";
import {
    isCsoundBusy,
    outputNameFromCsd,
    runPerformance,
    stopCsound,
    stopPerformance
} from "./actions";
import { nonCloudFiles } from "../file-tree/actions";

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
        terminateInstance: vi.fn(async () => undefined),
        stop: vi.fn(async () => undefined),
        on: vi.fn((name, callback) => listeners.set(name, callback)),
        once: vi.fn((name, callback) => listeners.set(name, callback))
    };
    vi.mocked(Csound).mockResolvedValue(engine);
});

afterEach(async () => {
    await stopPerformance();
    vi.clearAllMocks();
});

describe("shared Csound performance", () => {
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
        await stopPerformance();
        expect(engine.stop).toHaveBeenCalledOnce();
        expect(isCsoundBusy()).toBe(false);
    });
});
