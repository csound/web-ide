import { expect, it } from "vitest";
import { spliceAudio } from "./splice";
const audio = {
    sampleRate: 4,
    channels: [new Float32Array([0, 0.1, 0.2, 0.3])]
};
it("cuts frame ranges and splices only matching channel layouts", async () => {
    const signal = new AbortController().signal;
    const cut = await spliceAudio({ audio, range: [0.25, 0.75] }, signal);
    expect(cut.audio.channels[0]).toEqual(new Float32Array([0, 0.3]));
    const joined = await spliceAudio(
        {
            audio,
            range: [0.25, 0.75],
            insert: { sampleRate: 4, channels: [new Float32Array([0.9])] }
        },
        signal
    );
    expect(joined.audio.channels[0]).toEqual(new Float32Array([0, 0.9, 0.3]));
    expect(audio.channels[0]).toEqual(new Float32Array([0, 0.1, 0.2, 0.3]));
    await expect(
        spliceAudio(
            { audio, range: [0, 1], insert: { ...audio, sampleRate: 8 } },
            signal
        )
    ).rejects.toThrow("Resample");
    await expect(spliceAudio({ audio, range: [0, 1] }, signal)).rejects.toThrow(
        "shorter"
    );
    await expect(
        spliceAudio({ audio, range: [0.9, 0.1] }, signal)
    ).rejects.toThrow("range");
});
it("inserts at a zero-length range and cancels before publishing", async () => {
    const joined = await spliceAudio(
        { audio, range: [1, 1], insert: audio },
        new AbortController().signal
    );
    expect(joined.audio.channels[0].length).toBe(8);
    const controller = new AbortController();
    controller.abort();
    await expect(
        spliceAudio({ audio, range: [0, 0.5] }, controller.signal)
    ).rejects.toThrow();
});
