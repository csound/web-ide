import { decodeAudio, durationOf, encodeAudioAsync } from "./audio";
import { checkAudioLayout, MAX_AUDIO_SAMPLES } from "./limits";
import { runTool } from "./runner";
import type { AudioData, ToolRequest } from "./types";

export const MAX_MIX_TRACKS = 16;
export const routes = {
    stereo: "Stereo",
    swap: "Swap left / right",
    left: "Left only",
    right: "Right only"
};
export const trackDefaults = {
    start: 0,
    gain: 0,
    route: "stereo" as keyof typeof routes,
    muted: false,
    solo: false
};
export type MixTrack = typeof trackDefaults & {
    id: string;
    name: string;
    audio: AudioData;
    data: Uint8Array;
};
export type MixRequest = { tracks: MixTrack[]; gain: number };

/** Bound retained PCM across the whole mix, not just each uploaded file. */
export function checkMixSize(tracks: { audio: AudioData }[]) {
    if (tracks.length > MAX_MIX_TRACKS)
        throw new Error(`Use up to ${MAX_MIX_TRACKS} tracks per mix.`);
    if (
        tracks.reduce(
            (sum, track) => sum + track.audio.channels[0].length * 2,
            0
        ) > MAX_AUDIO_SAMPLES
    )
        throw new Error(
            "These tracks are too large to mix here. Use shorter recordings."
        );
}

/** Convert once on import; gain, offset and routing edits reuse these WAV bytes. */
export async function prepareMixAudio(
    bytes: Uint8Array,
    sampleRate: number | undefined,
    signal: AbortSignal,
    status: (text: string) => void
) {
    let audio = await decodeAudio(bytes, signal);
    if (audio.channels.length > 2)
        throw new Error("Choose mono or stereo audio for the mixer.");
    const rate = sampleRate ?? audio.sampleRate;
    checkAudioLayout(Math.ceil(durationOf(audio) * rate), 2);
    if (audio.channels.length === 1)
        audio = { ...audio, channels: [audio.channels[0], audio.channels[0]] };
    let data = await encodeAudioAsync(audio, signal);
    if (audio.sampleRate !== rate) {
        status(`Matching sample rate to ${rate} Hz…`);
        const result = await runTool(
            {
                tool: "src_conv",
                args: [
                    "-r",
                    String(rate),
                    "-W",
                    "-f",
                    "-o",
                    "resampled.wav",
                    "input.wav"
                ],
                files: [{ name: "input.wav", data }],
                output: "resampled.wav"
            },
            signal,
            status
        );
        data = result.data;
        audio = await decodeAudio(data, signal);
    }
    signal.throwIfAborted();
    return { audio, data };
}

/** Validate the full arrangement before allocating silence or starting WASM. */
export function mixLayout({ tracks, gain }: MixRequest) {
    if (!tracks.length) throw new Error("Add audio to start a mix.");
    checkMixSize(tracks);
    if (!Number.isFinite(gain) || gain < -60 || gain > 12)
        throw new Error("Set output gain between -60 and 12 dB.");
    const sampleRate = tracks[0].audio.sampleRate;
    let frames = 0;
    for (const track of tracks) {
        if (
            !Number.isFinite(track.start) ||
            track.start < 0 ||
            !Number.isFinite(track.gain) ||
            track.gain < -60 ||
            track.gain > 12 ||
            !Object.hasOwn(routes, track.route)
        )
            throw new Error(
                "Use a non-negative start time and a gain between -60 and 12 dB."
            );
        if (
            track.audio.sampleRate !== sampleRate ||
            track.audio.channels.length !== 2
        )
            throw new Error(
                "Mixer inputs must use the same sample rate and stereo channels."
            );
        checkAudioLayout(track.audio.channels[0].length, 2);
        frames = Math.max(
            frames,
            Math.round(track.start * sampleRate) +
                track.audio.channels[0].length
        );
    }
    checkAudioLayout(frames, 2);
    return { sampleRate, frames };
}

/** Keep a silent input spanning the mix: native mixer drops blocks with no active input. */
export async function makeMixRequest(
    request: MixRequest,
    signal: AbortSignal
): Promise<ToolRequest> {
    const { sampleRate, frames } = mixLayout(request);
    const silence = new Float32Array(frames);
    const bed = await encodeAudioAsync(
        { sampleRate, channels: [silence, silence] },
        signal
    );
    const args = ["-W", "-f", "-o", "mix.wav", "silence.wav"];
    const files = [{ name: "silence.wav", data: bed }];
    const solo = request.tracks.some((track) => track.solo);
    for (const [index, track] of request.tracks.entries()) {
        if (track.muted || (solo && !track.solo)) continue;
        const name = `track-${index}.wav`;
        args.push(
            "-S",
            String(Math.round(track.start * sampleRate)),
            "-F",
            String(10 ** ((track.gain + request.gain) / 20))
        );
        if (track.route === "left") args.push("-1");
        if (track.route === "right") args.push("-2");
        if (track.route === "swap") args.push("-^", "1", "2", "-^", "2", "1");
        args.push(name);
        files.push({ name, data: track.data });
    }
    return { tool: "mixer", args, files, output: "mix.wav" };
}

/** Render from the unchanged input tracks, then inspect the floating-point output peak. */
export async function buildMix(
    request: MixRequest,
    signal: AbortSignal,
    status: (text: string) => void
) {
    status("Preparing mix…");
    const command = await makeMixRequest(request, signal);
    const result = await runTool(command, signal, status);
    const audio = await decodeAudio(result.data, signal);
    let peak = 0;
    for (const samples of audio.channels) {
        for (let index = 0; index < samples.length; index++) {
            if (index % 65536 === 0) {
                await new Promise<void>((resolve) => setTimeout(resolve, 0));
                signal.throwIfAborted();
            }
            peak = Math.max(peak, Math.abs(samples[index]));
        }
    }
    return { name: "mix.wav", data: result.data, audio, peak };
}
