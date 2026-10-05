import { describe, expect, it } from "vitest";
import { finalizeFlac } from "./flac-file";
// A short 24-bit stereo render from @csound/browser beta36, before metadata repair.
const fixture = () =>
    new Uint8Array(
        Buffer.from(
            "ZkxhQwAAACIQABAAAAAAAAAAC7gDcAAAAAAAAAAAAAAAAAAAAAAAAAAAhAAAKCAAAAByZWZlcmVuY2UgbGliRkxBQyAxLjUuMCAyMDI1MDIxMQAAAAD/+HqMAAk/rhMAABAAP///////n//v///////z//3///////5//7///////8//9///////+f/+////////P//f///////n//v///////z//3////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+AAAAAAMTGAEgjX1yYHsJhe0NrG9umsXAAAAlAAAE/AAE/",
            "base64"
        )
    );
describe("browser FLAC finalization", () => {
    it("restores sample count, MD5 and frame sizes without changing audio frames", () => {
        const bytes = fixture();
        const result = finalizeFlac(bytes);
        expect(result.length).toBe(405);
        expect(new DataView(result.buffer).getUint32(22)).toBe(2368);
        expect([...result.subarray(12, 18)]).toEqual([0, 1, 63, 0, 1, 63]);
        expect(result.subarray(26, 42)).toEqual(bytes.subarray(405, 421));
        expect(result.subarray(86)).toEqual(bytes.subarray(86, 405));
        expect(new DataView(bytes.buffer).getUint32(22)).toBe(0);
    });
    it("leaves a finalized file unchanged", () => {
        const result = finalizeFlac(fixture());
        expect(finalizeFlac(result)).toBe(result);
    });
    it("rejects incomplete metadata rather than exporting a broken stream", () => {
        expect(() => finalizeFlac(fixture().slice(0, -3))).toThrow("metadata");
        expect(() => finalizeFlac(new Uint8Array(12))).toThrow("invalid FLAC");
    });
});
