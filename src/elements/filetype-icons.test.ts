import { expect, it } from "vitest";
import { getFileTypeIconDetails } from "./filetype-icons";

it.each(["csd", "orc", "sco", "udo"])(
    "preserves the %s badge even with a generic MIME type",
    (extension) => {
        expect(
            getFileTypeIconDetails(
                `project.${extension.toUpperCase()}`,
                "application/octet-stream"
            )
        ).toEqual({ kind: "csound", category: extension });
    }
);

it.each([
    ["README.markdown", "md", "MD"],
    ["sequence.MIDI", "midi", "MID"],
    ["bank.sf2", "sample", "SF2"],
    ["instrument.sfz", "sample", "SFZ"],
    ["stiffness.matrxB", "data", "MTX"],
    ["stiffness.matrxT", "data", "MTX"],
    ["matrix.mat", "data", "MAT"],
    ["macros.h", "code", "H"],
    ["instruments.inc", "code", "INC"],
    ["spectrum.pvx", "analysis", "PVX"],
    ["partials.ats", "analysis", "ATS"],
    ["voice.lpc", "analysis", "LPC"],
    ["partials.het", "analysis", "HET"],
    ["scale.scl", "tuning", "SCL"],
    ["mapping.kbm", "tuning", "KBM"],
    ["table.ftable", "data", "FT"],
    ["score.csv", "data", "CSV"],
    ["settings.json", "data", "JSON"],
    [".csoundrc", "data", "CFG"],
    ["score.py", "code", "PY"],
    ["player.html", "code", "HTML"],
    ["sample.FLAC", "audio", "FLAC"],
    ["sample.aiff", "audio", "AIF"],
    ["sample.opus", "audio", "OPUS"],
    ["cover.png", "image", "PNG"],
    ["session.webm", "media", "WEBM"],
    ["samples.tar.gz", "archive", "GZ"],
    ["score.pdf", "document", "PDF"],
    ["LICENSE", "text", "TXT"]
])(
    "recognizes %s without relying on browser MIME guesses",
    (name, category, label) => {
        expect(
            getFileTypeIconDetails(name, "application/octet-stream")
        ).toEqual({ kind: "media", category, label });
    }
);

it.each([
    [" Audio/MIDI; charset=binary ", "midi", "MID"],
    ["application/x-midi", "midi", "MID"],
    ["audio/flac", "audio", "AUD"],
    ["application/ogg", "audio", "OGG"],
    ["video/webm", "media", "VID"],
    ["image/png", "image", "IMG"],
    ["text/plain; charset=utf-8", "text", "TXT"],
    ["application/json", "data", "JSON"],
    ["application/pdf", "document", "PDF"],
    ["application/zip", "archive", "ZIP"]
])("uses %s for files without a known extension", (mime, category, label) => {
    expect(getFileTypeIconDetails("asset", mime)).toEqual({
        kind: "media",
        category,
        label
    });
});

it("prefers a known extension to an incorrect audio MIME type", () => {
    expect(getFileTypeIconDetails("piano.sf2", "audio/wav")).toMatchObject({
        category: "sample",
        label: "SF2"
    });
    expect(getFileTypeIconDetails("sequence.mid", "audio/wav")).toMatchObject({
        category: "midi",
        label: "MID"
    });
});

it("leaves unknown files generic and only reads extensions from the basename", () => {
    for (const name of [
        "asset",
        "asset.unknown",
        ".hidden",
        "samples.wav/asset",
        "samples.wav\\asset",
        "trailing."
    ]) {
        expect(
            getFileTypeIconDetails(name, "application/octet-stream")
        ).toBeNull();
    }
    expect(getFileTypeIconDetails("samples.wav\\notes.orc")).toEqual({
        kind: "csound",
        category: "orc"
    });
});
