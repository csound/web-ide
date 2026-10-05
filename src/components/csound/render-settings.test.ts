import { describe, expect, it } from "vitest";
import {
    macroOptions,
    renderOptions,
    validateRenderSettings,
    withRenderScore
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
    it("replaces the score verbatim including macros and section statements", () => {
        const source =
            '<CsoundSynthesizer><CsInstruments>instr 1\nendin</CsInstruments><CsScore bin="generator">original</CsScore></CsoundSynthesizer>';
        const score = "a 0 0 32\ni1 32 $DUR\ns\ni1 0 4\ne 0 12";
        const rendered = withRenderScore(source, score);
        expect(rendered).toContain(`<CsScore>\n${score}\n</CsScore>`);
        expect(rendered).not.toContain('bin="generator"');
        expect(source).toContain("original");
    });
});
