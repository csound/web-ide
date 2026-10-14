import { useSyncExternalStore } from "react";

export type IoSettings = {
    disableSharedArrayBuffers: boolean;
    inputDevice: string;
    inputChannel: number;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    outputDevice: string;
    latency: AudioContextLatencyCategory;
    sampleRate: number;
    midiInputs: "all" | string[];
    midiChannel: number;
};

export const defaultIoSettings: IoSettings = {
    disableSharedArrayBuffers: false,
    inputDevice: "",
    inputChannel: 0,
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    outputDevice: "",
    latency: "interactive",
    sampleRate: 0,
    midiInputs: "all",
    midiChannel: 0
};
const key = "csound-io-v1";
const listeners = new Set<() => void>();
let cached: IoSettings | undefined;

function read(): IoSettings {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        const settings = { ...defaultIoSettings };
        for (const field of [
            "disableSharedArrayBuffers",
            "echoCancellation",
            "noiseSuppression",
            "autoGainControl"
        ] as const)
            if (typeof data[field] === "boolean") settings[field] = data[field];
        for (const field of ["inputDevice", "outputDevice"] as const)
            if (typeof data[field] === "string") settings[field] = data[field];
        if (["interactive", "balanced", "playback"].includes(data.latency))
            settings.latency = data.latency;
        if ([0, 44100, 48000, 96000].includes(data.sampleRate))
            settings.sampleRate = data.sampleRate;
        if (
            Number.isInteger(data.inputChannel) &&
            data.inputChannel >= 0 &&
            data.inputChannel <= 32
        )
            settings.inputChannel = data.inputChannel;
        if (
            Number.isInteger(data.midiChannel) &&
            data.midiChannel >= 0 &&
            data.midiChannel <= 16
        )
            settings.midiChannel = data.midiChannel;
        if (
            Array.isArray(data.midiInputs) &&
            data.midiInputs.every((id: unknown) => typeof id === "string")
        )
            settings.midiInputs = data.midiInputs;
        // The old "sab=false" value was also written by default. It is not an opt-out.
        return settings;
    } catch {
        return { ...defaultIoSettings };
    }
}
export const getIoSettings = () => (cached ??= read());
export function saveIoSettings(settings: IoSettings) {
    cached = {
        ...settings,
        midiInputs:
            settings.midiInputs === "all" ? "all" : [...settings.midiInputs]
    };
    try {
        localStorage.setItem(key, JSON.stringify(cached));
    } catch {
        /* Embeds may deny storage. Keep preferences for this page. */
    }
    listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
if (typeof window !== "undefined")
    window.addEventListener("storage", (event) => {
        if (event.key === key || event.key === null) {
            cached = undefined;
            listeners.forEach((listener) => listener());
        }
    });
export const useIoSettings = () =>
    useSyncExternalStore(subscribe, getIoSettings);

export type IoStatus = {
    engine: string;
    sampleRate?: number;
    latency?: number;
    message?: string;
};
let status: IoStatus = { engine: "Ready" };
const statusListeners = new Set<() => void>();
export function setIoStatus(value: IoStatus) {
    status = value;
    statusListeners.forEach((listener) => listener());
}
export const useIoStatus = () =>
    useSyncExternalStore(
        (listener) => {
            statusListeners.add(listener);
            return () => {
                statusListeners.delete(listener);
            };
        },
        () => status
    );

/** Check the current frame on every run, including embeds with different headers. */
export function supportsSharedAudio() {
    try {
        if (
            !globalThis.crossOriginIsolated ||
            typeof SharedArrayBuffer !== "function" ||
            typeof Atomics === "undefined"
        )
            return false;
        const buffer = new SharedArrayBuffer(16);
        Atomics.store(new Int32Array(buffer), 0, 1);
        if (typeof structuredClone === "function") structuredClone(buffer);
        return true;
    } catch {
        return false;
    }
}
