import { describe, expect, it } from "vitest";
import {
    BANDS,
    FFT_SIZE,
    FRAME_SECONDS,
    HISTORY_COLUMNS,
    SpectralHistory,
    createBandSampler,
    frequencyAt,
    frequencyTicks,
    frequencyPosition,
    maximumFrequency
} from "./analysis";

describe("spectral analysis", () => {
    it("keeps the 1 kHz reference in short panels without crowding the labels", () => {
        const ticks = frequencyTicks(20000, 100);
        expect(ticks).toContain(1000);
        for (let index = 1; index < ticks.length; index++) {
            expect(
                (frequencyPosition(ticks[index], 20000) -
                    frequencyPosition(ticks[index - 1], 20000)) *
                    100
            ).toBeGreaterThanOrEqual(22);
        }
    });
    it.each([32000, 44100, 48000, 96000])(
        "places a 1 kHz tone on the logarithmic grid at %i Hz",
        (sampleRate) => {
            const fft = new Float32Array(FFT_SIZE / 2).fill(-Infinity);
            fft[Math.round(1000 / (sampleRate / FFT_SIZE))] = -20;
            const bands = new Uint8Array(BANDS);
            createBandSampler(sampleRate)(fft, bands);
            const peak = bands.indexOf(Math.max(...bands));
            expect(
                frequencyAt((peak + 0.5) / BANDS, maximumFrequency(sampleRate))
            ).toBeCloseTo(1000, -2);
            expect(bands[peak]).toBe(204);
            expect(bands[0]).toBe(0);
        }
    );

    it("keeps a narrow high partial when several bins share a band", () => {
        const fft = new Float32Array(FFT_SIZE / 2).fill(-Infinity);
        fft[3001] = -10;
        const bands = new Uint8Array(BANDS);
        createBandSampler(48000)(fft, bands);
        expect(Math.max(...bands)).toBe(230);
    });

    it("clamps the grid to Nyquist and gives octaves equal space", () => {
        expect(maximumFrequency(16000)).toBe(8000);
        expect(frequencyPosition(8000, 8000)).toBe(1);
        expect(
            frequencyPosition(400, 20000) - frequencyPosition(200, 20000)
        ).toBeCloseTo(
            frequencyPosition(200, 20000) - frequencyPosition(100, 20000)
        );
    });
});

describe("spectrogram history", () => {
    it("keeps the newest column and drops the oldest after ten seconds", () => {
        const history = new SpectralHistory();
        const bands = new Uint8Array(BANDS).fill(42);
        for (let index = 0; index < HISTORY_COLUMNS; index++)
            history.append(bands, index * FRAME_SECONDS);
        expect(history.head).toBe(0);
        bands.fill(123);
        history.append(bands, HISTORY_COLUMNS * FRAME_SECONDS);
        expect(history.head).toBe(1);
        expect(history.data[0]).toBe(123);
        expect(history.data[BANDS]).toBe(42);
    });

    it("limits capture rate and leaves gaps for missed measurements", () => {
        const history = new SpectralHistory();
        const bands = new Uint8Array(BANDS).fill(200);
        expect(history.append(bands, 0)).toBe(true);
        expect(history.append(bands, FRAME_SECONDS / 2)).toBe(false);
        history.append(bands, FRAME_SECONDS * 3);
        expect(history.head).toBe(4);
        expect(history.data[BANDS]).toBe(0);
        expect(history.data[BANDS * 2]).toBe(0);
        expect(history.data[BANDS * 3]).toBe(200);
    });

    it("resumes frozen history without adding pause time and clears for a new run", () => {
        const history = new SpectralHistory();
        const bands = new Uint8Array(BANDS).fill(100);
        history.append(bands, 0);
        history.resetClock();
        history.append(bands, 100);
        expect(history.head).toBe(2);
        expect(history.data[0]).toBe(100);
        history.clear();
        expect(history.head).toBe(0);
        expect(history.data.every((value) => value === 0)).toBe(true);
    });
});
