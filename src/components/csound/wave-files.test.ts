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
    it.each(["float", "double"])(
        "writes complete %s headers for direct, joined, and split exports",
        (bitDepth) => {
            const samples =
                bitDepth === "float"
                    ? new Float32Array([0.25, -0.5, 0.75, -1])
                    : new Float64Array([0.25, -0.5, 0.75, -1]);
            const direct = rawToWave(
                new Uint8Array(samples.buffer),
                48000,
                2,
                bitDepth,
                1
            );
            const joined = joinWaves([direct, direct]);
            const outputs = [
                { bytes: direct, frames: 2, channels: 2 },
                { bytes: joined, frames: 4, channels: 2 },
                ...splitWave(joined).map((bytes) => ({
                    bytes,
                    frames: 4,
                    channels: 1
                }))
            ];
            for (const { bytes, frames, channels } of outputs) {
                const view = new DataView(bytes.buffer);
                const tag = (offset: number) =>
                    new TextDecoder().decode(
                        bytes.subarray(offset, offset + 4)
                    );
                expect(view.getUint32(4, true)).toBe(bytes.length - 8);
                expect(tag(12)).toBe("fmt ");
                expect(view.getUint32(16, true)).toBe(18);
                expect(view.getUint16(20, true)).toBe(3);
                expect(view.getUint16(36, true)).toBe(0);
                expect(tag(38)).toBe("fact");
                expect(view.getUint32(42, true)).toBe(4);
                expect(view.getUint32(46, true)).toBe(frames);
                expect(tag(50)).toBe("data");
                expect(view.getUint32(54, true)).toBe(
                    frames * channels * samples.BYTES_PER_ELEMENT
                );
                expect(bytes.length).toBe(
                    58 + frames * channels * samples.BYTES_PER_ELEMENT
                );
                expect(readWave(bytes)).toMatchObject({
                    frames,
                    channels,
                    format: 3
                });
            }
            expect(readWave(direct).data).toEqual(
                new Uint8Array(samples.buffer)
            );
        }
    );
    it("keeps the compact PCM header and pads odd-sized data", () => {
        const bytes = rawToWave(
            new Uint8Array([128, 0, 255]),
            44100,
            1,
            "8",
            1
        );
        const view = new DataView(bytes.buffer);
        expect(bytes.length).toBe(48);
        expect(view.getUint32(4, true)).toBe(40);
        expect(view.getUint32(16, true)).toBe(16);
        expect(new TextDecoder().decode(bytes.subarray(36, 40))).toBe("data");
        expect(view.getUint32(40, true)).toBe(3);
        expect([...bytes.subarray(44)]).toEqual([128, 0, 255, 0]);
    });
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
