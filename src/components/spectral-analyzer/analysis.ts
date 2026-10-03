export const FFT_SIZE = 8192;
export const BANDS = 512;
export const HISTORY_COLUMNS = 300;
export const HISTORY_SECONDS = 10;
export const FRAME_SECONDS = HISTORY_SECONDS / HISTORY_COLUMNS;
export const MIN_DB = -100;
export const MAX_DB = 0;
export const MIN_HZ = 20;

export function maximumFrequency(sampleRate: number) {
    return Math.min(20000, sampleRate / 2);
}

export function frequencyPosition(hz: number, maximum: number) {
    return Math.log(hz / MIN_HZ) / Math.log(maximum / MIN_HZ);
}

export function frequencyAt(position: number, maximum: number) {
    return MIN_HZ * (maximum / MIN_HZ) ** position;
}

export function frequencyLabel(hz: number) {
    return hz >= 1000 ? `${+(hz / 1000).toFixed(1)}k` : `${Math.round(hz)}`;
}

export function frequencyTicks(maximum: number, pixels: number) {
    const ticks = [MIN_HZ, maximum];
    // Keep familiar decade marks first when a short panel needs fewer labels.
    for (const hz of [1000, 100, 10000, 50, 200, 500, 2000, 5000]) {
        const position = frequencyPosition(hz, maximum);
        if (
            hz < maximum &&
            ticks.every(
                (tick) =>
                    Math.abs(position - frequencyPosition(tick, maximum)) *
                        pixels >=
                    22
            )
        )
            ticks.push(hz);
    }
    return ticks.sort((a, b) => a - b);
}

// Take the strongest FFT bin in each logarithmic band so narrow partials
// remain visible when many high-frequency bins share a screen row.
export function createBandSampler(sampleRate: number) {
    const maximum = maximumFrequency(sampleRate);
    const binHz = sampleRate / FFT_SIZE;
    const starts = new Uint16Array(BANDS);
    const ends = new Uint16Array(BANDS);
    for (let band = 0; band < BANDS; band++) {
        starts[band] = Math.max(
            1,
            Math.floor(frequencyAt(band / BANDS, maximum) / binHz)
        );
        ends[band] = Math.min(
            FFT_SIZE / 2,
            Math.max(
                starts[band] + 1,
                Math.ceil(frequencyAt((band + 1) / BANDS, maximum) / binHz)
            )
        );
    }
    return (fft: Float32Array, target: Uint8Array) => {
        for (let band = 0; band < BANDS; band++) {
            let db = MIN_DB;
            for (let bin = starts[band]; bin < ends[band]; bin++) {
                if (fft[bin] > db) db = fft[bin];
            }
            target[band] = Math.round(
                Math.min(1, (db - MIN_DB) / (MAX_DB - MIN_DB)) * 255
            );
        }
    };
}

export class SpectralHistory {
    readonly data = new Uint8Array(BANDS * HISTORY_COLUMNS);
    readonly latest = new Uint8Array(BANDS);
    head = 0;
    private previousTime: number | undefined;

    resetClock() {
        this.previousTime = undefined;
    }

    clear() {
        this.data.fill(0);
        this.latest.fill(0);
        this.head = 0;
        this.resetClock();
    }

    isDue(time: number) {
        return (
            this.previousTime === undefined ||
            time - this.previousTime + 1e-6 >= FRAME_SECONDS
        );
    }

    append(bands: Uint8Array, time: number) {
        const elapsed =
            this.previousTime === undefined
                ? FRAME_SECONDS
                : time - this.previousTime;
        const steps = Math.floor((elapsed + 1e-6) / FRAME_SECONDS);
        if (steps < 1) return false;
        this.previousTime =
            this.previousTime === undefined
                ? time
                : this.previousTime + steps * FRAME_SECONDS;
        // A slow or hidden tab must not stretch ten seconds into a minute.
        // Missing measurements stay blank instead of inventing audio data.
        for (let step = 0; step < Math.min(steps, HISTORY_COLUMNS); step++) {
            const offset = this.head * BANDS;
            this.data.fill(0, offset, offset + BANDS);
            if (step === Math.min(steps, HISTORY_COLUMNS) - 1)
                this.data.set(bands, offset);
            this.head = (this.head + 1) % HISTORY_COLUMNS;
        }
        this.latest.set(bands);
        return true;
    }
}
