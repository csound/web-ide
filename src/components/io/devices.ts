import type { IoSettings } from "./settings";

export const audioContextClass = () =>
    globalThis.AudioContext ||
    (
        globalThis as typeof globalThis & {
            webkitAudioContext?: typeof AudioContext;
        }
    ).webkitAudioContext;
type RoutedAudioContext = AudioContext & {
    setSinkId?: (id: string) => Promise<void>;
};
export const canSelectOutput = () =>
    !!(audioContextClass()?.prototype as RoutedAudioContext | undefined)
        ?.setSinkId;
export async function audioDevices() {
    return (await navigator.mediaDevices?.enumerateDevices?.()) || [];
}
export function deviceError(error: unknown) {
    const exception = error instanceof Error || error instanceof DOMException;
    const name = exception ? error.name : "";
    if (name === "NotAllowedError" || name === "SecurityError")
        return "Access was blocked. Allow this device in your browser settings. An embedded player also needs permission from its host page.";
    if (name === "NotFoundError" || name === "OverconstrainedError")
        return "The selected device or channel is unavailable. Reconnect it or choose another device.";
    if (name === "NotReadableError")
        return "The device is busy or could not start. Check whether another app is using it.";
    return exception ? error.message : "Could not open this device. Try again.";
}
export async function captureInput(settings: IoSettings, signal: AbortSignal) {
    if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
            "Audio input is unavailable here. Open the IDE over HTTPS and allow microphone access."
        );
    signal.throwIfAborted();
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            ...(settings.inputDevice
                ? { deviceId: { exact: settings.inputDevice } }
                : {}),
            // Ideal lets the browser supply fewer channels on smaller devices.
            channelCount: { ideal: Math.max(2, settings.inputChannel || 32) },
            echoCancellation: settings.echoCancellation,
            noiseSuppression: settings.noiseSuppression,
            autoGainControl: settings.autoGainControl
        }
    });
    const stop = () => stream.getTracks().forEach((track) => track.stop());
    if (signal.aborted) {
        stop();
        signal.throwIfAborted();
    }
    signal.addEventListener("abort", stop, { once: true });
    const channels = stream.getAudioTracks()[0]?.getSettings().channelCount;
    if (channels && settings.inputChannel > channels) {
        stop();
        throw new Error(
            `This input exposes ${channels} channel${channels === 1 ? "" : "s"}. Choose an available channel.`
        );
    }
    return stream;
}

export async function routeOutput(context: AudioContext, device: string) {
    if (!device) return;
    const routed = context as RoutedAudioContext;
    if (!routed.setSinkId)
        throw new Error(
            "This browser uses the system output. Choose System default in Audio Output."
        );
    try {
        await routed.setSinkId(device);
    } catch (cause) {
        throw new Error(
            "Could not use the saved output. Reconnect it or choose another device in Audio Output.",
            { cause }
        );
    }
}

let midiAccess: MIDIAccess | undefined;
let pendingMidi: Promise<MIDIAccess> | undefined;
export const currentMidiAccess = () => midiAccess;
export function connectMidiDevices(): Promise<MIDIAccess> {
    if (!navigator.requestMIDIAccess)
        return Promise.reject(
            new Error(
                "This browser does not support MIDI controllers. You can still use the virtual keyboard."
            )
        );
    // Ask only in response to Connect or playback of a MIDI piece. Never request SysEx.
    return (pendingMidi ??= navigator
        .requestMIDIAccess({ sysex: false })
        .then((access) => {
            midiAccess = access;
            return access;
        })
        .finally(() => {
            pendingMidi = undefined;
        }));
}
