import { describe, expect, it } from "vitest";
import {
    macroOptions,
    renderOptions,
    validateRenderSettings
} from "./render-settings";
const settings = {
    filename: "piece",
    format: "wav",
    bitDepth: "16",
    quality: 0.6
} as const;
describe("advanced render settings", () => {
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
