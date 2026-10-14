import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Csound } from "@csound/browser";
import type { CsoundObj } from "../csound/types";
import { captureInput, deviceError, routeOutput } from "./devices";
import {
    AudioStartupError,
    createPlaybackIo,
    SharedAudioStartupError,
    withDeviceMethod
} from "./runtime";
import {
    defaultIoSettings,
    getIoSettings,
    saveIoSettings,
    supportsSharedAudio
} from "./settings";
import { routeMidi } from "./midi";

class TestContext {
    static instances: TestContext[] = [];
    state = "running";
    sampleRate = 48000;
    baseLatency = 0.01;
    resume = vi.fn(async () => {});
    close = vi.fn(async () => {
        this.state = "closed";
    });
    setSinkId = vi.fn(async () => {});
    constructor(public options: AudioContextOptions) {
        TestContext.instances.push(this);
    }
}
const controller = () => new AbortController();
const factory = () =>
    vi.fn<typeof Csound>().mockResolvedValue({
        name: "Csound: Audio Worklet, Shared-Array Buffer"
    } as CsoundObj);
const track = { stop: vi.fn(), getSettings: () => ({ channelCount: 2 }) };
const stream = {
    getTracks: () => [track],
    getAudioTracks: () => [track]
} as unknown as MediaStream;

beforeEach(() => {
    saveIoSettings({ ...defaultIoSettings });
    TestContext.instances = [];
    vi.stubGlobal("AudioContext", TestContext);
    vi.stubGlobal("crossOriginIsolated", true);
    Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: { getUserMedia: vi.fn(async () => stream) }
    });
});
afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});

it("probes the current frame every time and honors only the explicit opt-out", async () => {
    localStorage.setItem("sab", "false");
    expect(getIoSettings().disableSharedArrayBuffers).toBe(false);
    for (const [isolated, disabled, expected] of [
        [true, false, true],
        [false, false, false],
        [true, true, false]
    ]) {
        vi.stubGlobal("crossOriginIsolated", isolated);
        saveIoSettings({
            ...defaultIoSettings,
            disableSharedArrayBuffers: disabled
        });
        const io = createPlaybackIo(controller().signal, vi.fn());
        const create = factory();
        await io.create(create);
        expect(create).toHaveBeenCalledWith({
            audioContext: expect.any(TestContext),
            useWorker: true,
            useSAB: expected
        });
        await io.dispose();
        expect(TestContext.instances.at(-1)?.close).toHaveBeenCalledOnce();
    }
});

it("does not assume that exposed shared memory can be used", () => {
    vi.stubGlobal("structuredClone", () => {
        throw new DOMException("Blocked", "DataCloneError");
    });
    expect(supportsSharedAudio()).toBe(false);
    vi.stubGlobal("SharedArrayBuffer", undefined);
    expect(supportsSharedAudio()).toBe(false);
});

it("keeps settings in memory when an embed denies storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("Blocked", "SecurityError");
    });
    window.dispatchEvent(new StorageEvent("storage", { key: "csound-io-v1" }));
    expect(getIoSettings()).toEqual(defaultIoSettings);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("Blocked", "SecurityError");
    });
    expect(() =>
        saveIoSettings({ ...defaultIoSettings, inputChannel: 2 })
    ).not.toThrow();
    expect(getIoSettings().inputChannel).toBe(2);
});

it("rejects shared factory failures so the owner can retry a fresh vanilla engine", async () => {
    const io = createPlaybackIo(controller().signal, vi.fn());
    await expect(
        io.create(factory().mockRejectedValue(new Error("DataCloneError")))
    ).rejects.toBeInstanceOf(SharedAudioStartupError);
    await io.dispose();
    expect(TestContext.instances[0].state).toBe("closed");
});

it("lets a slow MessageChannel factory finish loading", async () => {
    vi.useFakeTimers();
    const io = createPlaybackIo(controller().signal, vi.fn(), false);
    let resolve!: (value: CsoundObj) => void;
    const create = factory().mockReturnValue(
        new Promise((done) => {
            resolve = done;
        })
    );
    const settled = vi.fn();
    const pending = io.create(create);
    void pending.then(settled, settled);
    await vi.advanceTimersByTimeAsync(60000);
    expect(create).toHaveBeenCalledOnce();
    expect(settled).not.toHaveBeenCalled();
    const engine = {
        name: "Csound: Audio Worklet, Worker",
        terminateInstance: vi.fn(async () => {})
    } as unknown as CsoundObj;
    resolve(engine);
    await expect(pending).resolves.toBe(engine);
    expect(engine.terminateInstance).not.toHaveBeenCalled();
    await io.dispose();
    expect(TestContext.instances[0].state).toBe("closed");
});

it("times out shared loading and terminates an engine that arrives too late", async () => {
    vi.useFakeTimers();
    const io = createPlaybackIo(controller().signal, vi.fn());
    let resolve!: (value: CsoundObj) => void;
    const create = factory().mockReturnValue(
        new Promise((done) => {
            resolve = done;
        })
    );
    const result = expect(io.create(create)).rejects.toBeInstanceOf(
        SharedAudioStartupError
    );
    await vi.advanceTimersByTimeAsync(30000);
    await result;
    await io.dispose();
    const terminateInstance = vi.fn(async () => {});
    resolve({ terminateInstance } as unknown as CsoundObj);
    await vi.waitFor(() => expect(terminateInstance).toHaveBeenCalledOnce());
    expect(TestContext.instances[0].state).toBe("closed");
});

it.each([true, false])(
    "cancels promptly and terminates a factory that resolves after cancellation (shared=%s)",
    async (shared) => {
        const abort = controller();
        const io = createPlaybackIo(abort.signal, vi.fn(), shared);
        let resolve!: (value: CsoundObj) => void;
        const create = factory().mockReturnValue(
            new Promise((done) => {
                resolve = done;
            })
        );
        const pending = io.create(create);
        await vi.waitFor(() => expect(create).toHaveBeenCalledOnce());
        abort.abort();
        await expect(pending).rejects.toMatchObject({ name: "AbortError" });
        await io.dispose();
        const terminateInstance = vi.fn(async () => {});
        resolve({ terminateInstance } as unknown as CsoundObj);
        await vi.waitFor(() =>
            expect(terminateInstance).toHaveBeenCalledOnce()
        );
        expect(TestContext.instances[0].state).toBe("closed");
    }
);

it("restores the SDK MIDI hook on timeout instead of keeping global overrides", async () => {
    vi.useFakeTimers();
    saveIoSettings({ ...defaultIoSettings, midiInputs: [] });
    const request = vi.fn();
    Object.defineProperty(navigator, "requestMIDIAccess", {
        configurable: true,
        value: request
    });
    const descriptor = Object.getOwnPropertyDescriptor(
        navigator,
        "requestMIDIAccess"
    );
    const io = createPlaybackIo(controller().signal, vi.fn());
    const engine = {
        name: "Shared-Array Buffer",
        isRequestingRtMidiInput: async () => 1,
        start: vi.fn(() => new Promise(() => {}))
    } as unknown as CsoundObj;
    const result = expect(io.start(engine)).rejects.toBeInstanceOf(
        SharedAudioStartupError
    );
    await vi.advanceTimersByTimeAsync(12000);
    await result;
    expect(request).not.toHaveBeenCalled();
    expect(
        Object.getOwnPropertyDescriptor(navigator, "requestMIDIAccess")
    ).toEqual(descriptor);
    await io.dispose();
    Reflect.deleteProperty(navigator, "requestMIDIAccess");
});

const startupCalls = [
    ["requestsInput", "isRequestingRtAudioInput"],
    ["start", "isRequestingRtMidiInput"],
    ["enableInput", "enableAudioInput"],
    ["start", "start"]
] as const;

it.each(startupCalls)(
    "bounds and classifies %s failures from %s for the actual backend",
    async (operation, method) => {
        vi.useFakeTimers();
        for (const shared of [true, false]) {
            for (const timeout of [true, false]) {
                const io = createPlaybackIo(controller().signal, vi.fn());
                const cause = new Error("Worker disconnected");
                const engine = {
                    name: shared ? "Shared-Array Buffer" : "Worker",
                    isRequestingRtAudioInput: vi.fn(async () => 0),
                    isRequestingRtMidiInput: vi.fn(async () => 0),
                    enableAudioInput: vi.fn(async () => undefined),
                    start: vi.fn(async () => 0)
                };
                engine[method].mockImplementation(() =>
                    timeout
                        ? new Promise<never>(() => {})
                        : Promise.reject(cause)
                );
                const pending = io[operation](engine as unknown as CsoundObj);
                const result = pending.catch((error) => error);
                await vi.advanceTimersByTimeAsync(12000);
                const error = await result;
                expect(error).toBeInstanceOf(AudioStartupError);
                expect(error instanceof SharedAudioStartupError).toBe(shared);
                if (timeout) expect(error.cause.message).toContain("timed out");
                else expect(error.cause).toBe(cause);
                expect(engine[method]).toHaveBeenCalledOnce();
                await io.dispose();
            }
        }
    }
);

it.each(startupCalls)(
    "does not turn cancellation of %s (%s) into a backend retry",
    async (operation, method) => {
        const abort = controller();
        const io = createPlaybackIo(abort.signal, vi.fn());
        const engine = {
            name: "Shared-Array Buffer",
            isRequestingRtAudioInput: vi.fn(async () => 0),
            isRequestingRtMidiInput: vi.fn(async () => 0),
            enableAudioInput: vi.fn(async () => undefined),
            start: vi.fn(async () => 0)
        };
        engine[method].mockImplementation(() => new Promise<never>(() => {}));
        const pending = io[operation](engine as unknown as CsoundObj);
        const result = expect(pending).rejects.toMatchObject({
            name: "AbortError"
        });
        await vi.waitFor(() => expect(engine[method]).toHaveBeenCalledOnce());
        abort.abort();
        await result;
        await io.dispose();
    }
);

it("keeps microphone permission failures out of shared-worker retries", async () => {
    const cause = new DOMException("Blocked", "NotAllowedError");
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(cause);
    const io = createPlaybackIo(controller().signal, vi.fn());
    const engine = {
        name: "Shared-Array Buffer",
        enableAudioInput: vi.fn()
    } as unknown as CsoundObj;
    await expect(io.enableInput(engine)).rejects.toBe(cause);
    expect(engine.enableAudioInput).not.toHaveBeenCalled();
    await io.dispose();
});

it("requests the exact input and stops a late permission grant after cancellation", async () => {
    let allow!: (stream: MediaStream) => void;
    vi.mocked(navigator.mediaDevices.getUserMedia).mockReturnValue(
        new Promise((resolve) => {
            allow = resolve;
        })
    );
    const abort = controller();
    const result = captureInput(
        {
            ...defaultIoSettings,
            inputDevice: "interface",
            noiseSuppression: true
        },
        abort.signal
    );
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: {
            deviceId: { exact: "interface" },
            channelCount: { ideal: 32 },
            echoCancellation: false,
            noiseSuppression: true,
            autoGainControl: false
        }
    });
    abort.abort();
    allow(stream);
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(track.stop).toHaveBeenCalledOnce();
});

it.each([
    [1, 2],
    [6, 6],
    [32, 32]
])(
    "requests enough channels to select input %s",
    async (inputChannel, requestedChannels) => {
        const audioTrack = {
            stop: vi.fn(),
            getSettings: () => ({ channelCount: 32 })
        };
        const multichannel = {
            getTracks: () => [audioTrack],
            getAudioTracks: () => [audioTrack]
        } as unknown as MediaStream;
        vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(
            multichannel
        );
        const abort = controller();
        await expect(
            captureInput({ ...defaultIoSettings, inputChannel }, abort.signal)
        ).resolves.toBe(multichannel);
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
            audio: expect.objectContaining({
                channelCount: { ideal: requestedChannels }
            })
        });
        abort.abort();
        expect(audioTrack.stop).toHaveBeenCalledOnce();
    }
);

it.each(["NotFoundError", "OverconstrainedError"])(
    "uses device-neutral recovery for %s",
    (name) => {
        expect(deviceError(new DOMException("Unavailable", name))).toBe(
            "The selected device or channel is unavailable. Reconnect it or choose another device."
        );
    }
);

it("refuses an unavailable input channel and releases its microphone", async () => {
    await expect(
        captureInput(
            { ...defaultIoSettings, inputChannel: 3 },
            controller().signal
        )
    ).rejects.toThrow("2 channels");
    expect(track.stop).toHaveBeenCalledOnce();
});

it("hands the SDK our stream without a second permission request and restores the browser API", async () => {
    const io = createPlaybackIo(controller().signal, vi.fn());
    await io.create(factory());
    const original = navigator.mediaDevices.getUserMedia;
    const engine = {
        enableAudioInput: async () => {
            expect(
                await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: false, sampleSize: 32 }
                })
            ).toBe(stream);
            throw new Error("SDK input failed");
        }
    } as CsoundObj;
    await expect(io.enableInput(engine)).rejects.toMatchObject({
        cause: new Error("SDK input failed")
    });
    expect(navigator.mediaDevices.getUserMedia).toBe(original);
    expect(original).toHaveBeenCalledOnce();
    await io.dispose();
    expect(track.stop).toHaveBeenCalled();
});

it("restores inherited methods without adding own properties", async () => {
    const original = vi.fn();
    const object = Object.create({ method: original });
    await expect(
        withDeviceMethod(object, "method", vi.fn(), async () => {
            throw new Error("failure");
        })
    ).rejects.toThrow("failure");
    expect(Object.hasOwn(object, "method")).toBe(false);
    expect(object.method).toBe(original);
});

it("does not silently play through speakers when a saved output fails", async () => {
    const context = new TestContext({});
    context.setSinkId.mockRejectedValue(
        new DOMException("Gone", "NotFoundError")
    );
    await expect(
        routeOutput(context as unknown as AudioContext, "headphones")
    ).rejects.toThrow("saved output");
    expect(context.setSinkId).toHaveBeenCalledExactlyOnceWith("headphones");
    await expect(routeOutput({} as AudioContext, "headphones")).rejects.toThrow(
        "System default"
    );
    await expect(routeOutput({} as AudioContext, "")).resolves.toBeUndefined();
});

class MidiInput extends EventTarget {
    state = "connected";
    open = vi.fn(async () => this);
    close = vi.fn(async () => this);
    constructor(public id: string) {
        super();
    }
    send(data: number[]) {
        this.dispatchEvent(
            Object.assign(new Event("midimessage"), {
                data: new Uint8Array(data)
            })
        );
    }
}

it("routes only selected MIDI inputs and channels, follows hotplug, and removes every listener on stop", async () => {
    const input = new MidiInput("keyboard");
    const other = new MidiInput("pads");
    const inputs = new Map([
        [input.id, input],
        [other.id, other]
    ]);
    const access = Object.assign(new EventTarget(), {
        inputs
    }) as unknown as MIDIAccess;
    const engine = { midiMessage: vi.fn(async () => {}) };
    const disconnect = routeMidi(
        access,
        { ...defaultIoSettings, midiInputs: ["keyboard"], midiChannel: 2 },
        engine,
        vi.fn()
    );
    input.send([0x90, 60, 100]);
    other.send([0x91, 60, 100]);
    expect(engine.midiMessage).not.toHaveBeenCalled();
    input.send([0x91, 60, 100]);
    expect(engine.midiMessage).toHaveBeenCalledExactlyOnceWith(0x91, 60, 100);
    input.send([0xf8]);
    expect(engine.midiMessage).toHaveBeenLastCalledWith(0xf8, 0, 0);
    input.state = "disconnected";
    access.dispatchEvent(new Event("statechange"));
    await vi.waitFor(() =>
        expect(engine.midiMessage).toHaveBeenCalledWith(0xbf, 120, 0)
    );
    expect(input.close).toHaveBeenCalled();
    input.state = "connected";
    access.dispatchEvent(new Event("statechange"));
    expect(input.open).toHaveBeenCalledTimes(2);
    disconnect();
    engine.midiMessage.mockClear();
    input.send([0x91, 60, 100]);
    access.dispatchEvent(new Event("statechange"));
    expect(engine.midiMessage).not.toHaveBeenCalled();
    expect(input.open).toHaveBeenCalledTimes(2);
    expect(other.open).not.toHaveBeenCalled();
});
