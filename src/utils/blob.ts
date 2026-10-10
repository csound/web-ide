/** Preserve view bounds and avoid copying ordinary buffers before creating a Blob. */
export function blobFromBytes(bytes: Uint8Array, options?: BlobPropertyBag) {
    // Blob rejects SharedArrayBuffer views. Only those need a private copy.
    const source =
        bytes.buffer instanceof ArrayBuffer
            ? new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)
            : new Uint8Array(bytes);
    return new Blob([source], options);
}
