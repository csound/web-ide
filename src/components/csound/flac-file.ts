/**
 * @csound/browser beta36 appends writes after a seek instead of overwriting.
 * libFLAC finalizes STREAMINFO with three writes: MD5 (16), sample count (5),
 * frame sizes (6). Move those bytes from the tail to their intended offsets.
 * See xiph/flac src/libFLAC/stream_encoder.c, update_metadata_().
 * Already-finalized files from a corrected writer pass through unchanged.
 */
export function finalizeFlac(bytes: Uint8Array): Uint8Array {
    const read24 = (offset: number) =>
        bytes[offset] * 65536 + bytes[offset + 1] * 256 + bytes[offset + 2];
    const readSamples = (offset: number) =>
        (bytes[offset] & 15) * 2 ** 32 +
        new DataView(
            bytes.buffer,
            bytes.byteOffset,
            bytes.byteLength
        ).getUint32(offset + 1);
    if (
        bytes.length < 42 ||
        new TextDecoder().decode(bytes.subarray(0, 4)) !== "fLaC" ||
        (bytes[4] & 127) !== 0 ||
        read24(5) !== 34
    )
        throw new Error("Csound produced an invalid FLAC file.");
    if (readSamples(21) > 0) return bytes;
    let audioStart = 4;
    while (audioStart + 4 <= bytes.length) {
        const last = (bytes[audioStart] & 128) !== 0;
        audioStart += 4 + read24(audioStart + 1);
        if (last) break;
    }
    const tail = bytes.length - 27;
    const minFrame = read24(tail + 21);
    const maxFrame = read24(tail + 24);
    if (
        tail <= audioStart ||
        bytes[audioStart] !== 255 ||
        (bytes[audioStart + 1] & 254) !== 248 ||
        bytes.subarray(12, 18).some((value) => value !== 0) ||
        bytes.subarray(26, 42).some((value) => value !== 0) ||
        (bytes[tail + 16] & 240) !== (bytes[21] & 240) ||
        !readSamples(tail + 16) ||
        !minFrame ||
        maxFrame < minFrame ||
        maxFrame > tail - audioStart
    )
        throw new Error("The FLAC render has incomplete metadata.");
    const result = bytes.slice(0, tail);
    result.set(bytes.subarray(tail, tail + 16), 26);
    result.set(bytes.subarray(tail + 16, tail + 21), 21);
    result.set(bytes.subarray(tail + 21), 12);
    return result;
}
