import { describe, expect, it } from "vitest";
import {
    encodingCsd,
    joinWaves,
    rawToWave,
    readWave,
    splitWave
} from "./wave-files";

const stereo = () =>
    rawToWave(new Uint8Array([1, 0, 11, 0, 2, 0, 12, 0]), 48000, 2, "16", 1);
describe("WAV export", () => {
    it("writes one valid header and preserves PCM frames", () => {
        const bytes = stereo();
        expect(new DataView(bytes.buffer).getUint32(4, true)).toBe(
            bytes.length - 8
        );
        expect(readWave(bytes)).toMatchObject({
            channels: 2,
            sampleRate: 48000,
            bits: 16,
            frames: 2,
            format: 1
        });
    });
    it("joins in order without silence or discarded frames", () => {
        const wave = readWave(joinWaves([stereo(), stereo()]));
        expect(wave.frames).toBe(4);
        expect([...wave.data]).toEqual([
            1, 0, 11, 0, 2, 0, 12, 0, 1, 0, 11, 0, 2, 0, 12, 0
        ]);
    });
    it("splits channels without mixing or changing their frame count", () => {
        const parts = splitWave(stereo()).map(readWave);
        expect(parts.map((part) => [...part.data])).toEqual([
            [1, 0, 2, 0],
            [11, 0, 12, 0]
        ]);
        expect(
            parts.every((part) => part.frames === 2 && part.channels === 1)
        ).toBe(true);
    });
    it.each(["float", "double"])(
        "normalizes raw %s output using the orchestra's 0dbfs",
        (bitDepth) => {
            const array =
                bitDepth === "float"
                    ? new Float32Array([16384, -32768])
                    : new Float64Array([16384, -32768]);
            const wave = readWave(
                rawToWave(
                    new Uint8Array(array.buffer),
                    44100,
                    1,
                    bitDepth,
                    32768
                )
            );
            const data = new DataView(
                wave.data.buffer,
                wave.data.byteOffset,
                wave.data.byteLength
            );
            expect(
                bitDepth === "float"
                    ? data.getFloat32(0, true)
                    : data.getFloat64(0, true)
            ).toBe(0.5);
            expect(
                bitDepth === "float"
                    ? data.getFloat32(4, true)
                    : data.getFloat64(8, true)
            ).toBe(-1);
        }
    );
    it("rejects incompatible tracks rather than silently resampling or mixing", () => {
        const mono = rawToWave(new Uint8Array([0, 0]), 44100, 1, "16", 1);
        expect(() => joinWaves([stereo(), mono])).toThrow(
            "same sample rate and channel count"
        );
    });
    it("rejects incomplete frames and truncated containers", () => {
        expect(() => rawToWave(new Uint8Array(3), 48000, 2, "16", 1)).toThrow(
            "incomplete frame"
        );
        expect(() => readWave(stereo().slice(0, 45))).toThrow("incomplete");
    });
    it("uses the exact frame duration and channel count for final encoding", () => {
        const csd = encodingCsd(stereo(), "input.wav");
        expect(csd).toContain("ksmps=1\nnchnls=2");
        expect(csd).toContain('a1, a2 diskin2 "input.wav", 1, 0, 0');
        expect(csd).toContain(`i1 0 ${2 / 48000}`);
    });
});
