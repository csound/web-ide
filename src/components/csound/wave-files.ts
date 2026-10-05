// Work on PCM frames, without decoding through AudioContext (which can resample).
export type Wave = {
    channels: number;
    sampleRate: number;
    bits: number;
    format: number;
    frames: number;
    data: Uint8Array;
};
const limit = 512 * 1024 * 1024;
const text = (bytes: Uint8Array, offset: number, length: number) =>
    new TextDecoder().decode(bytes.subarray(offset, offset + length));

export function readWave(bytes: Uint8Array): Wave {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (text(bytes, 0, 4) !== "RIFF" || text(bytes, 8, 4) !== "WAVE")
        throw new Error("Expected a PCM WAV render.");
    let format = 0,
        channels = 0,
        sampleRate = 0,
        bits = 0;
    let data: Uint8Array | undefined;
    for (let offset = 12; offset + 8 <= bytes.length; ) {
        const size = view.getUint32(offset + 4, true);
        const start = offset + 8;
        if (start + size > bytes.length)
            throw new Error("The WAV render is incomplete.");
        const id = text(bytes, offset, 4);
        if (id === "fmt " && size >= 16) {
            format = view.getUint16(start, true);
            channels = view.getUint16(start + 2, true);
            sampleRate = view.getUint32(start + 4, true);
            bits = view.getUint16(start + 14, true);
            if (format === 65534 && size >= 40)
                format = view.getUint16(start + 24, true);
        }
        if (id === "data") data = bytes.subarray(start, start + size);
        offset = start + size + (size % 2);
    }
    if (
        !data ||
        ![1, 3].includes(format) ||
        channels < 1 ||
        channels > 64 ||
        !sampleRate ||
        ![8, 16, 24, 32, 64].includes(bits)
    )
        throw new Error("Unsupported PCM WAV layout.");
    const frameBytes = (channels * bits) / 8;
    if (data.length % frameBytes)
        throw new Error("The WAV render ends with an incomplete frame.");
    return {
        format,
        channels,
        sampleRate,
        bits,
        frames: data.length / frameBytes,
        data
    };
}

function packWave(wave: Wave, chunks: Uint8Array[]): Uint8Array {
    const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    if (size > limit)
        throw new Error(
            "This combined export exceeds 512 MB. Render fewer tracks at a time."
        );
    const floatingPoint = wave.format === 3;
    const formatSize = floatingPoint ? 18 : 16;
    const dataOffset = 20 + formatSize + (floatingPoint ? 12 : 0);
    const frameBytes = (wave.channels * wave.bits) / 8;
    const bytes = new Uint8Array(dataOffset + 8 + size + (size % 2));
    const view = new DataView(bytes.buffer);
    const writeText = (offset: number, value: string) =>
        bytes.set(new TextEncoder().encode(value), offset);
    writeText(0, "RIFF");
    view.setUint32(4, bytes.length - 8, true);
    writeText(8, "WAVEfmt ");
    view.setUint32(16, formatSize, true);
    view.setUint16(20, wave.format, true);
    view.setUint16(22, wave.channels, true);
    view.setUint32(24, wave.sampleRate, true);
    view.setUint32(28, wave.sampleRate * frameBytes, true);
    view.setUint16(32, frameBytes, true);
    view.setUint16(34, wave.bits, true);
    if (floatingPoint) {
        view.setUint16(36, 0, true); // WAVEFORMATEX cbSize: no extra format data.
        writeText(38, "fact");
        view.setUint32(42, 4, true);
        // Derive the frame count from all output data, including joined tracks.
        view.setUint32(46, size / frameBytes, true);
    }
    writeText(dataOffset, "data");
    view.setUint32(dataOffset + 4, size, true);
    let offset = dataOffset + 8;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
    }
    return bytes;
}

export function joinWaves(parts: Uint8Array[]): Uint8Array {
    if (!parts.length) throw new Error("Choose at least one track.");
    const waves = parts.map(readWave);
    const first = waves[0];
    if (
        waves.some(
            (wave) =>
                wave.channels !== first.channels ||
                wave.sampleRate !== first.sampleRate ||
                wave.bits !== first.bits ||
                wave.format !== first.format
        )
    )
        throw new Error(
            "To combine tracks, choose the same sample rate and channel count for every track."
        );
    return packWave(
        first,
        waves.map((wave) => wave.data)
    );
}

/** Raw output avoids the browser file writer's broken seek/overwrite handling. */
export function rawToWave(
    data: Uint8Array,
    sampleRate: number,
    channels: number,
    bitDepth: string,
    zeroDbfs: number
): Uint8Array {
    const format = ["float", "double"].includes(bitDepth) ? 3 : 1;
    const bits =
        bitDepth === "float"
            ? 32
            : bitDepth === "double"
              ? 64
              : Number(bitDepth);
    if (
        !Number.isInteger(sampleRate) ||
        sampleRate <= 0 ||
        !Number.isInteger(channels) ||
        channels < 1 ||
        channels > 64 ||
        ![8, 16, 24, 32, 64].includes(bits) ||
        data.length % ((channels * bits) / 8)
    )
        throw new Error(
            "The raw render has an invalid audio layout or an incomplete frame."
        );
    if (format === 3 && (!Number.isFinite(zeroDbfs) || zeroDbfs <= 0))
        throw new Error("The orchestra has an invalid 0dbfs value.");
    if (format === 3 && zeroDbfs !== 1) {
        // Raw floating-point output uses orchestra units instead of normalized audio.
        data = data.slice();
        const view = new DataView(
            data.buffer,
            data.byteOffset,
            data.byteLength
        );
        for (let offset = 0; offset < data.length; offset += bits / 8) {
            if (bits === 32)
                view.setFloat32(
                    offset,
                    view.getFloat32(offset, true) / zeroDbfs,
                    true
                );
            else
                view.setFloat64(
                    offset,
                    view.getFloat64(offset, true) / zeroDbfs,
                    true
                );
        }
    }
    return packWave(
        {
            data,
            sampleRate,
            channels,
            format,
            bits,
            frames: data.length / ((channels * bits) / 8)
        },
        [data]
    );
}

export function splitWave(bytes: Uint8Array): Uint8Array[] {
    const wave = readWave(bytes);
    if (wave.data.length > limit)
        throw new Error(
            "This channel export exceeds 512 MB. Render a shorter score."
        );
    const width = wave.bits / 8;
    const channels = Array.from(
        { length: wave.channels },
        () => new Uint8Array(wave.frames * width)
    );
    for (let frame = 0; frame < wave.frames; frame++) {
        for (let channel = 0; channel < wave.channels; channel++) {
            const start = (frame * wave.channels + channel) * width;
            channels[channel].set(
                wave.data.subarray(start, start + width),
                frame * width
            );
        }
    }
    return channels.map((data) => packWave({ ...wave, channels: 1 }, [data]));
}

/** A second Csound pass encodes the joined PCM once, with no extra tail or resampling. */
export function encodingCsd(bytes: Uint8Array, inputName: string): string {
    const wave = readWave(bytes);
    const outputs = Array.from(
        { length: wave.channels },
        (_, index) => `a${index + 1}`
    ).join(", ");
    return `<CsoundSynthesizer>\n<CsOptions>\n-d\n</CsOptions>\n<CsInstruments>\nsr=${wave.sampleRate}\nksmps=1\nnchnls=${wave.channels}\n0dbfs=1\ninstr 1\n${outputs} diskin2 "${inputName}", 1, 0, 0\nout ${outputs}\nendin\n</CsInstruments>\n<CsScore>\ni1 0 ${wave.frames / wave.sampleRate}\ne\n</CsScore>\n</CsoundSynthesizer>`;
}
