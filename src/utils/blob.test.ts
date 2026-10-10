// @vitest-environment node
import { expect, it } from "vitest";
import { blobFromBytes } from "./blob";

it("keeps only the view's bytes and preserves the MIME type", async () => {
    const data = new Uint8Array([1, 2, 3, 4]);
    const blob = blobFromBytes(data.subarray(1, 3), { type: "audio/wav" });
    expect([...new Uint8Array(await blob.arrayBuffer())]).toEqual([2, 3]);
    expect(blob.type).toBe("audio/wav");
});

it("copies a shared view into a Blob without including adjacent bytes", async () => {
    const data = new Uint8Array(new SharedArrayBuffer(4));
    data.set([1, 2, 3, 4]);
    const blob = blobFromBytes(data.subarray(1, 3));
    data.fill(0);
    expect([...new Uint8Array(await blob.arrayBuffer())]).toEqual([2, 3]);
});
