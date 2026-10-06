import { expect, it } from "vitest";
import { analysisPlot } from "./plots";

/** Build a minimal ATS header with room for two single-partial frames. */
function ats(partials: number, frames: number) {
    const bytes = new Uint8Array(128);
    const view = new DataView(bytes.buffer);
    view.setFloat64(0, 123, true);
    view.setFloat64(32, partials, true);
    view.setFloat64(40, frames, true);
    view.setFloat64(72, 1, true);
    return bytes;
}

it.each([0, -1, 0.5, Number.NaN, Infinity])(
    "rejects invalid ATS counts %s with a clear error",
    (count) => {
        expect(() => analysisPlot("partials", ats(count, 1), 1)).toThrow(
            "Incomplete ATS file."
        );
        expect(() => analysisPlot("partials", ats(1, count), 1)).toThrow(
            "Incomplete ATS file."
        );
    }
);

it("still rejects truncated ATS frames", () => {
    expect(() => analysisPlot("partials", ats(1, 3), 1)).toThrow(
        "Incomplete ATS file."
    );
});

it("plots valid ATS frames", () => {
    const bytes = ats(1, 1);
    const view = new DataView(bytes.buffer);
    view.setFloat64(88, 0.5, true);
    view.setFloat64(96, 220, true);
    expect(analysisPlot("partials", bytes, 1)).toMatchObject({
        kind: "lines",
        series: [[[0, 220]]]
    });
});
