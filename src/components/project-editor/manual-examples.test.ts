import { afterEach, expect, it, vi } from "vitest";
import {
    loadManualExample,
    loadManualExampleAssets,
    manualExampleUrl
} from "./manual-examples";
import type { TemporaryDocument } from "./temporary-documents";

afterEach(() => vi.unstubAllGlobals());
const source = "<CsoundSynthesizer>\n; exact source\n</CsoundSynthesizer>";
const example = (value: string, assets: string[] = []): TemporaryDocument => ({
    filename: "example.csd",
    value,
    source: {
        kind: "manual-example",
        url: "/manual/examples/example.csd",
        assets
    }
});

it("loads the exact example into a temporary buffer with its linked assets", async () => {
    const fetch = vi.fn(async () => new Response(source));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    const result = await loadManualExample(
        "/manual/examples/oscili.csd",
        ["/manual/examples/fox.wav"],
        signal
    );
    expect(result).toMatchObject({
        filename: "oscili.csd",
        value: source,
        source: { kind: "manual-example" }
    });
    expect(result.source?.assets).toEqual([
        `${location.origin}/manual/examples/fox.wav`
    ]);
    expect(fetch).toHaveBeenCalledWith(expect.any(URL), { signal });
});

it.each([
    "https://example.com/evil.csd",
    "/editor/private.csd",
    "/manual/examples/../secret.csd",
    "/manual/examples/%2e%2e%2fsecret.csd",
    "/manual/examples/oscili.csd?query=1"
])("rejects a link outside the local examples: %s", (url) => {
    expect(() => manualExampleUrl(url)).toThrow("Invalid manual example link");
});

it("reports missing and invalid examples", async () => {
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response("missing", { status: 404 }))
    );
    await expect(
        loadManualExample(
            "/manual/examples/oscili.csd",
            [],
            new AbortController().signal
        )
    ).rejects.toThrow("Could not open");
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response("<html>fallback</html>"))
    );
    await expect(
        loadManualExample(
            "/manual/examples/oscili.csd",
            [],
            new AbortController().signal
        )
    ).rejects.toThrow("does not contain");
});

it("loads sample bytes for playback with the caller's cancellation signal", async () => {
    const fetch = vi.fn(async () => new Response(new Uint8Array([1, 2, 3])));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    expect(
        await loadManualExampleAssets(
            {
                filename: "diskin2.csd",
                value: source,
                source: {
                    kind: "manual-example",
                    url: "/manual/examples/diskin2.csd",
                    assets: ["/manual/examples/drumsMlp.wav"]
                }
            },
            signal
        )
    ).toEqual([{ name: "drumsMlp.wav", data: new Uint8Array([1, 2, 3]) }]);
    expect(fetch).toHaveBeenCalledWith(expect.any(URL), { signal });
});

it("loads unlinked quoted assets, skips comments and unknown files, and deduplicates links", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async (url) =>
        String(url).endsWith("example-assets.json")
            ? Response.json([
                  "fox.wav",
                  "drumsMlp.wav",
                  "01hpschd.sf2",
                  "mary.wav"
              ])
            : new Response(new Uint8Array([1, 2, 3]))
    );
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    const assets = await loadManualExampleAssets(
        example(
            `
; a soundin "mary.wav"
// a soundin "mary.wav"
/* f 1 0 0 1 "mary.wav" 0 0 0 */
a diskin2 "./fox.wav"
f 1 0 0 1 "drumsMlp.wav" 0 0 0
Sfile = "01hpschd.sf2"
a diskin2 "fox.wav"
prints "not-fox.wav", "missing.wav", "https://example.com/mary.wav"
`,
            ["/manual/examples/fox.wav"]
        ),
        signal
    );
    expect(assets.map((asset) => asset.name)).toEqual([
        "fox.wav",
        "drumsMlp.wav",
        "01hpschd.sf2"
    ]);
    expect(assets.every((asset) => asset.data[0] === 1)).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(fetch.mock.calls.every((call) => call[1]?.signal === signal)).toBe(
        true
    );
});

it("rescans the edited source on each playback", async () => {
    vi.stubGlobal(
        "fetch",
        vi.fn(async (url: RequestInfo | URL) =>
            String(url).endsWith("example-assets.json")
                ? Response.json(["fox.wav", "mary.wav"])
                : new Response(new Uint8Array([1]))
        )
    );
    const document = example('a soundin "fox.wav"');
    const signal = new AbortController().signal;
    expect((await loadManualExampleAssets(document, signal))[0].name).toBe(
        "fox.wav"
    );
    document.value = 'a soundin "mary.wav"';
    expect(
        (await loadManualExampleAssets(document, signal)).map(
            (asset) => asset.name
        )
    ).toEqual(["mary.wav"]);
});

it.each([null, ["../private.wav"], ["https://example.com/fox.wav"]])(
    "rejects an invalid asset index without fetching its files: %s",
    async (index) => {
        const fetch = vi.fn(async () => Response.json(index));
        vi.stubGlobal("fetch", fetch);
        await expect(
            loadManualExampleAssets(
                example('a soundin "fox.wav"'),
                new AbortController().signal
            )
        ).rejects.toThrow("Invalid manual sample index");
        expect(fetch).toHaveBeenCalledTimes(1);
    }
);

it("reports a missing index or bundled sample before playback", async () => {
    const fetch = vi.fn(async () => new Response("missing", { status: 404 }));
    vi.stubGlobal("fetch", fetch);
    const document = example('a soundin "fox.wav"');
    const signal = new AbortController().signal;
    await expect(loadManualExampleAssets(document, signal)).rejects.toThrow(
        "Could not load the manual sample index"
    );
    fetch.mockResolvedValueOnce(Response.json(["fox.wav"]));
    await expect(loadManualExampleAssets(document, signal)).rejects.toThrow(
        "Could not load fox.wav"
    );
});
