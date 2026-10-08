export const MAX_AUDIO_BYTES = 64 * 1024 * 1024;
export const MAX_AUDIO_SAMPLES = 16_000_000;
export const MAX_AUDIO_CHANNELS = 8;

/** Reject encoded audio before buffering or copying it. */
export function checkAudioBytes(size: number) {
    if (size > MAX_AUDIO_BYTES)
        throw new Error("Choose an audio file smaller than 64 MB.");
}

/** Check decoded dimensions before allocating channel arrays. */
export function checkAudioLayout(frames: number, channels: number) {
    if (
        !Number.isSafeInteger(frames) ||
        frames < 1 ||
        !Number.isInteger(channels) ||
        channels < 1 ||
        channels > MAX_AUDIO_CHANNELS ||
        frames * channels > MAX_AUDIO_SAMPLES
    )
        throw new Error(
            "This file is too large to edit here. Choose a shorter recording with up to 8 channels."
        );
}

/** Stop a local or remote read as soon as it exceeds the byte limit or is cancelled. */
export async function readAudioStream(
    stream: ReadableStream<Uint8Array>,
    signal: AbortSignal,
    size?: number,
    checkSize: (size: number) => void = checkAudioBytes
): Promise<Uint8Array> {
    const reader = stream.getReader();
    const abort = () => {
        void reader.cancel().catch(() => {});
    };
    signal.addEventListener("abort", abort, { once: true });
    try {
        signal.throwIfAborted();
        if (size !== undefined) checkSize(size);
        const chunks: Uint8Array[] = [];
        let length = 0;
        while (true) {
            const { done, value } = await reader.read();
            signal.throwIfAborted();
            if (done) break;
            length += value.byteLength;
            checkSize(length);
            chunks.push(value);
        }
        const bytes = new Uint8Array(length);
        let offset = 0;
        for (const chunk of chunks) {
            bytes.set(chunk, offset);
            offset += chunk.length;
        }
        return bytes;
    } finally {
        signal.removeEventListener("abort", abort);
        await reader.cancel().catch(() => {});
        reader.releaseLock();
    }
}
