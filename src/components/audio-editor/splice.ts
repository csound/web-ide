import { durationOf, encodeAudioAsync } from "../audio-tools/audio";
import { checkAudioLayout } from "../audio-tools/limits";
import type { AudioData } from "../audio-tools/types";
import { scanAudio } from "./inspect";

export type SpliceRequest = {
    audio: AudioData;
    range: [number, number];
    insert?: AudioData;
};
/** Replace an exact range of source frames; matching layouts avoid implicit resampling or downmixing. */
export async function spliceAudio(
    { audio, range, insert }: SpliceRequest,
    signal: AbortSignal
) {
    signal.throwIfAborted();
    if (
        range.some((value) => !Number.isFinite(value)) ||
        range[0] < 0 ||
        range[1] < range[0] ||
        range[1] > durationOf(audio)
    )
        throw new Error("Choose a range within the source file.");
    if (
        insert &&
        (insert.sampleRate !== audio.sampleRate ||
            insert.channels.length !== audio.channels.length)
    )
        throw new Error(
            `The inserted clip needs ${audio.sampleRate} Hz and ${audio.channels.length} channels. Resample it first or choose a matching file.`
        );
    const first = Math.round(range[0] * audio.sampleRate),
        end = Math.round(range[1] * audio.sampleRate);
    const insertedFrames = insert?.channels[0].length ?? 0;
    const frames = audio.channels[0].length - (end - first) + insertedFrames;
    checkAudioLayout(frames, audio.channels.length);
    const channels: Float32Array[] = [];
    for (let i = 0; i < audio.channels.length; i++) {
        signal.throwIfAborted();
        const samples = new Float32Array(frames);
        samples.set(audio.channels[i].subarray(0, first));
        if (insert) samples.set(insert.channels[i], first);
        samples.set(audio.channels[i].subarray(end), first + insertedFrames);
        channels.push(samples);
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    const result = { sampleRate: audio.sampleRate, channels };
    const { peaks } = await scanAudio(result, signal);
    return {
        audio: result,
        peaks,
        data: await encodeAudioAsync(result, signal)
    };
}
