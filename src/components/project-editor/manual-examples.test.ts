import { afterEach, expect, it, vi } from "vitest";
import {
    loadManualExample,
    loadManualExampleAssets,
    manualExampleUrl
} from "./manual-examples";

afterEach(() => vi.unstubAllGlobals());
const source = "<CsoundSynthesizer>\n; exact source\n</CsoundSynthesizer>";

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
