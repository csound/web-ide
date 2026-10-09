import { expect, it } from "vitest";
import { readAudioInfo, readSampleChunks } from "./metadata";
import { scanAudio } from "./inspect";
import { encodeAudio } from "../audio-tools/audio";

function chunk(id: string, data: Uint8Array, little = true) {
    const bytes = new Uint8Array(8 + data.length + (data.length % 2));
    bytes.set(new TextEncoder().encode(id));
    new DataView(bytes.buffer).setUint32(4, data.length, little);
    bytes.set(data, 8);
    return bytes;
}
function container(type: string, chunks: Uint8Array[]) {
    const bytes = new Uint8Array(
        12 + chunks.reduce((sum, item) => sum + item.length, 0)
    );
    bytes.set(new TextEncoder().encode(type === "WAVE" ? "RIFF" : "FORM"));
    new DataView(bytes.buffer).setUint32(4, bytes.length - 8, type === "WAVE");
    bytes.set(new TextEncoder().encode(type), 8);
    let at = 12;
    for (const item of chunks) {
        bytes.set(item, at);
        at += item.length;
    }
    return bytes;
}
it("reports source sample frames, rate, channels and encoding without browser resampling", async () => {
    const bytes = encodeAudio({
        sampleRate: 22050,
        channels: [new Float32Array(2205), new Float32Array(2205)]
    });
    const info = await readAudioInfo(bytes);
    expect(info).toMatchObject({
        sampleRate: 22050,
        channels: 2,
        bits: 32,
        frames: 2205,
        duration: 0.1
    });
    expect(info.codec).toBe("IEEE_FLOAT");
});
it("reads WAV sampler loops, signed instrument values, and BWF text including coding history", () => {
    const sampler = new Uint8Array(60),
        sv = new DataView(sampler.buffer);
    sv.setUint32(12, 60, true);
    sv.setUint32(28, 1, true);
    sv.setUint32(40, 1, true);
    sv.setUint32(44, 8, true);
    sv.setUint32(48, 80, true);
    const broadcast = new Uint8Array(620),
        bv = new DataView(broadcast.buffer);
    broadcast.set(new TextEncoder().encode("Room microphone"));
    broadcast.set(new TextEncoder().encode("A=PCM,F=48000"), 602);
    bv.setUint16(346, 2, true);
    bv.setBigUint64(338, BigInt("9007199254740993"), true);
    const info = readSampleChunks(
        container("WAVE", [
            chunk("JUNK", new Uint8Array(1)),
            chunk("inst", new Uint8Array([60, 254, 250, 1, 100, 1, 127])),
            chunk("smpl", sampler),
            chunk("bext", broadcast)
        ])
    );
    expect(info.instrument).toContainEqual({ label: "Gain", value: "-6 dB" });
    expect(info.instrument).toContainEqual({
        label: "Loop 1",
        value: "Alternating: 8 to 80 frames; continuous"
    });
    expect(info.broadcast).toContainEqual({
        label: "Coding history",
        value: "A=PCM,F=48000"
    });
    expect(info.broadcast).toContainEqual({
        label: "Time reference (frames)",
        value: "9007199254740993"
    });
});
it("resolves AIFF loop markers to sample frames", () => {
    const inst = new Uint8Array(20),
        iv = new DataView(inst.buffer);
    inst[0] = 64;
    iv.setInt16(6, -3);
    iv.setUint16(8, 1);
    iv.setInt16(10, 3);
    iv.setInt16(12, 4);
    const markers = new Uint8Array(18),
        mv = new DataView(markers.buffer);
    mv.setUint16(0, 2);
    mv.setInt16(2, 3);
    mv.setUint32(4, 10);
    mv.setInt16(10, 4);
    mv.setUint32(12, 100);
    expect(
        readSampleChunks(
            container("AIFF", [
                chunk("INST", inst, false),
                chunk("MARK", markers, false)
            ])
        ).instrument
    ).toContainEqual({
        label: "Sustain loop",
        value: "Forward: 10 to 100 frames"
    });
});
it("ignores truncated chunks and bounds forged loop counts by the bytes present", () => {
    expect(readSampleChunks(new Uint8Array(2))).toEqual({
        instrument: [],
        broadcast: []
    });
    const data = new Uint8Array(36);
    new DataView(data.buffer).setUint32(28, 0xffffffff, true);
    const bytes = container("WAVE", [chunk("smpl", data)]);
    expect(readSampleChunks(bytes).instrument).toContainEqual({
        label: "Loop count",
        value: "0"
    });
    expect(() =>
        readSampleChunks(bytes.subarray(0, bytes.length - 1))
    ).not.toThrow();
});
it("scans all channels once for bounded peaks, RMS, DC and full-scale samples", async () => {
    const result = await scanAudio(
        {
            sampleRate: 4,
            channels: [
                new Float32Array([0, 1, -1, 0]),
                new Float32Array([0.25, 0.25, 0.25, 0.25])
            ]
        },
        new AbortController().signal
    );
    expect(result.channels[0]).toEqual({
        peak: 1,
        rms: Math.sqrt(0.5),
        dc: 0,
        clipped: 2
    });
    expect(result.channels[1]).toEqual({
        peak: 0.25,
        rms: 0.25,
        dc: 0.25,
        clipped: 0
    });
    expect(result.peaks[2]).toEqual([-1, 0.25]);
    const controller = new AbortController();
    controller.abort();
    await expect(
        scanAudio(
            { sampleRate: 4, channels: [new Float32Array(4)] },
            controller.signal
        )
    ).rejects.toThrow();
});
