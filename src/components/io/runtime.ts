import type { Csound } from "@csound/browser";
import type { CsoundObj } from "../csound/types";
import {
    audioContextClass,
    captureInput,
    connectMidiDevices,
    routeOutput
} from "./devices";
import { routeMidi } from "./midi";
import {
    getIoSettings,
    setIoStatus,
    supportsSharedAudio,
    type IoSettings
} from "./settings";

export class AudioStartupError extends Error {}
export class SharedAudioStartupError extends AudioStartupError {}

async function whileActive<T>(
    action: Promise<T>,
    signal: AbortSignal,
    timeout?: number
): Promise<T> {
    signal.throwIfAborted();
    let onAbort = () => {};
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            action,
            new Promise<never>((_, reject) => {
                onAbort = () => reject(signal.reason);
                signal.addEventListener("abort", onAbort, { once: true });
                if (timeout)
                    timer = setTimeout(
                        () =>
                            reject(
                                new AudioStartupError(
                                    "Audio startup timed out. Try playing again."
                                )
                            ),
                        timeout
                    );
            })
        ]);
    } finally {
        signal.removeEventListener("abort", onAbort);
        clearTimeout(timer);
    }
}

/**
 * beta39 captures browser devices itself and has no stream/MIDI-provider options.
 * Scope these two hooks to its calls, restore property descriptors in finally,
 * and leave unrelated requests alone. Remove this bridge when the SDK accepts providers.
 */
export async function withDeviceMethod<T>(
    target: object,
    key: string,
    value: unknown,
    action: () => Promise<T>
): Promise<T> {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    Object.defineProperty(target, key, {
        configurable: true,
        writable: true,
        value
    });
    try {
        return await action();
    } finally {
        if (Reflect.get(target, key) === value) {
            if (descriptor) Object.defineProperty(target, key, descriptor);
            else Reflect.deleteProperty(target, key);
        }
    }
}

export function createPlaybackIo(
    signal: AbortSignal,
    report: (text: string) => void,
    useSAB?: boolean
) {
    const settings: IoSettings = { ...getIoSettings() };
    const shared =
        useSAB !== false &&
        !settings.disableSharedArrayBuffers &&
        supportsSharedAudio();
    const lifetime = new AbortController();
    const abort = () => lifetime.abort();
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    let context: AudioContext | undefined;
    let inputStream: MediaStream | undefined;
    let inputNode: MediaStreamAudioSourceNode | undefined;
    let splitter: ChannelSplitterNode | undefined;
    let selectedChannel: MediaStreamAudioDestinationNode | undefined;
    let disconnectMidi = () => {};
    const dispose = async () => {
        lifetime.abort();
        signal.removeEventListener("abort", abort);
        disconnectMidi();
        inputNode?.disconnect();
        splitter?.disconnect();
        selectedChannel?.stream.getTracks().forEach((track) => track.stop());
        inputStream?.getTracks().forEach((track) => track.stop());
        if (context && context.state !== "closed")
            await context.close().catch(() => {});
    };
    return {
        async create(factory: typeof Csound) {
            lifetime.signal.throwIfAborted();
            const Constructor = audioContextClass();
            if (!Constructor)
                throw new Error("This browser does not support Web Audio.");
            context = new Constructor({
                latencyHint: settings.latency,
                ...(settings.sampleRate
                    ? { sampleRate: settings.sampleRate }
                    : {})
            });
            // Own the context so rejected startup and device routing have one cleanup path.
            await whileActive(context.resume(), lifetime.signal, 12000);
            await whileActive(
                routeOutput(context, settings.outputDevice),
                lifetime.signal,
                12000
            );
            lifetime.signal.throwIfAborted();
            let expired = false;
            try {
                const pending = factory({
                    audioContext: context,
                    useWorker: true,
                    useSAB: shared
                }).then(async (engine) => {
                    if (expired || lifetime.signal.aborted) {
                        await engine?.terminateInstance();
                        return undefined;
                    }
                    return engine as CsoundObj | undefined;
                });
                const engine = await whileActive(
                    pending,
                    lifetime.signal,
                    30000
                );
                if (!engine)
                    throw new AudioStartupError(
                        "Csound could not initialize audio."
                    );
                return engine;
            } catch (cause) {
                expired = true;
                lifetime.signal.throwIfAborted();
                if (shared)
                    throw new SharedAudioStartupError(
                        "Shared audio could not initialize.",
                        { cause }
                    );
                throw cause;
            }
        },
        async enableInput(engine: CsoundObj) {
            inputStream = await captureInput(settings, lifetime.signal);
            let stream = inputStream;
            if (settings.inputChannel && context) {
                inputNode = context.createMediaStreamSource(inputStream);
                splitter = context.createChannelSplitter(
                    Math.max(
                        settings.inputChannel,
                        inputStream.getAudioTracks()[0]?.getSettings()
                            .channelCount || 2
                    )
                );
                selectedChannel = context.createMediaStreamDestination();
                selectedChannel.channelCount = 1;
                inputNode.connect(splitter);
                splitter.connect(selectedChannel, settings.inputChannel - 1);
                stream = selectedChannel.stream;
            }
            const media = navigator.mediaDevices;
            const original = media.getUserMedia.bind(media);
            await withDeviceMethod(
                media,
                "getUserMedia",
                (constraints: MediaStreamConstraints) => {
                    const audio = constraints?.audio;
                    if (
                        audio &&
                        typeof audio === "object" &&
                        audio.sampleSize === 32 &&
                        audio.echoCancellation === false &&
                        !constraints.video
                    ) {
                        lifetime.signal.throwIfAborted();
                        return Promise.resolve(stream);
                    }
                    return original(constraints);
                },
                () =>
                    whileActive(
                        engine.enableAudioInput(),
                        lifetime.signal,
                        12000
                    ).catch((cause) => {
                        if (
                            cause instanceof AudioStartupError &&
                            shared &&
                            /Shared/i.test(engine.name)
                        )
                            throw new SharedAudioStartupError(
                                "Shared audio input did not respond.",
                                { cause }
                            );
                        throw cause;
                    })
            );
        },
        async start(engine: CsoundObj) {
            const wantsMidi = await whileActive(
                engine.isRequestingRtMidiInput(),
                lifetime.signal,
                12000
            );
            let access: MIDIAccess | undefined;
            if (
                wantsMidi &&
                (settings.midiInputs === "all" || settings.midiInputs.length)
            ) {
                try {
                    access = await whileActive(
                        connectMidiDevices(),
                        lifetime.signal
                    );
                } catch (error) {
                    report(
                        error instanceof Error
                            ? error.message
                            : "MIDI access is unavailable. The virtual keyboard still works."
                    );
                }
            }
            lifetime.signal.throwIfAborted();
            const start = () =>
                whileActive(engine.start(), lifetime.signal, 12000);
            let result: number;
            try {
                const original = navigator.requestMIDIAccess?.bind(navigator);
                result =
                    wantsMidi && original
                        ? await withDeviceMethod(
                              navigator,
                              "requestMIDIAccess",
                              (options?: MIDIOptions) =>
                                  options === undefined
                                      ? Promise.resolve({ inputs: new Map() })
                                      : original(options),
                              start
                          )
                        : await start();
                if (result !== 0)
                    throw new Error(
                        "Csound could not start. Read the console for details."
                    );
            } catch (cause) {
                lifetime.signal.throwIfAborted();
                if (shared && /Shared/i.test(engine.name))
                    throw new SharedAudioStartupError(
                        "Shared audio could not start.",
                        { cause }
                    );
                throw new AudioStartupError(
                    "Audio could not start. Read the console for details.",
                    { cause }
                );
            }
            lifetime.signal.throwIfAborted();
            if (access)
                disconnectMidi = routeMidi(access, settings, engine, report);
            setIoStatus({
                engine: /Shared/i.test(engine.name)
                    ? "SharedArrayBuffers"
                    : "MessageChannel",
                sampleRate: context?.sampleRate,
                latency: context?.baseLatency
            });
            return result;
        },
        dispose
    };
}
