import { describe, expect, it } from "vitest";
import {
    macroOptions,
    renderOptions,
    renderFilename,
    validateRenderSettings
} from "./render-settings";
const settings = {
    filename: "piece",
    format: "wav",
    bitDepth: "16",
    quality: 0.6
} as const;
describe("advanced render settings", () => {
    it("uses lossless FLAC flags and changes extensions without a lossy quality setting", () => {
        const flac = {
            ...settings,
            format: "flac" as const,
            bitDepth: "24" as const
        };
        expect(renderOptions(flac)).toContain("--format=flac:24bit");
        expect(
            renderOptions(flac).some((option) => option.includes("vbr"))
        ).toBe(false);
        expect(
            renderOptions({ ...flac, bitDepth: "16", dither: true })
        ).toContain("-Z1");
        expect(renderFilename({ ...flac, filename: "piece.wav" })).toBe(
            "piece.flac"
        );
        expect(renderFilename({ ...settings, filename: "piece.flac" })).toBe(
            "piece.wav"
        );
    });
    it("validates FLAC depth and channel limits, including mono exports", () => {
        expect(
            validateRenderSettings({
                ...settings,
                format: "flac",
                bitDepth: "float"
            })
        ).toContain("16-bit or 24-bit");
        expect(
            validateRenderSettings({ ...settings, format: "flac", channels: 9 })
        ).toContain("eight channels");
        expect(
            validateRenderSettings(
                { ...settings, format: "flac", channels: 9 },
                true
            )
        ).toBeUndefined();
        expect(
            validateRenderSettings(
                { ...settings, format: "flac", channels: 65 },
                true
            )
        ).toContain("1 to 64");
    });
    it("enables sample-accurate timing without forcing ksmps to one", () => {
        expect(
            renderOptions({ ...settings, sampleAccurate: true, ksmps: 64 })
        ).toEqual(expect.arrayContaining(["--sample-accurate", "--ksmps=64"]));
        expect(renderOptions(settings)).not.toContain("--sample-accurate");
    });
    it("passes channel and dither overrides only where supported", () => {
        expect(
            renderOptions({ ...settings, channels: 8, dither: true })
        ).toContain("--nchnls=8");
        expect(renderOptions({ ...settings, dither: true })).toContain("-Z1");
        expect(
            renderOptions({ ...settings, bitDepth: "24", dither: true })
        ).toContain("-Z0");
        expect(
            renderOptions({ ...settings, format: "mp3", dither: true })
        ).toContain("-Z0");
    });
    it("keeps macro scope and expressions intact", () => {
        expect(macroOptions("FREQ: 440*2\nGAIN: 0.1", "o")).toEqual([
            "--omacro:FREQ=440*2",
            "--omacro:GAIN=0.1"
        ]);
        expect(macroOptions("DUR: 120", "s")).toEqual(["--smacro:DUR=120"]);
    });
    it.each([
        "FREQ 440",
        "FREQ: 440 -odac",
        "FREQ: 440\nFREQ: 220",
        "X: </CsOptions>"
    ])("rejects malformed macro input %s", (value) => {
        expect(
            validateRenderSettings({ ...settings, orchestraMacros: value })
        ).toBeTruthy();
    });
});
