import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { prepareScorePreprocessors } from "./score-preprocessors";

vi.mock("@csound/wasm-bin/lib/csbeats.wasm?url", () => ({
    default: "/csbeats.wasm"
}));
vi.mock("@csound/wasm-bin/lib/scot.wasm?url", () => ({
    default: "/scot.wasm"
}));
let prepare: typeof prepareScorePreprocessors;
let files: Map<string, Uint8Array>;
const fs = {
    readdir: vi.fn(async () => [...files.keys()]),
    writeFile: vi.fn(async (name: string, bytes: Uint8Array) => {
        files.set(name, bytes);
    })
};
const score = (command: string) =>
    `<CsScore bin="${command}">\ni1 m1 b1 C4 q mf\n</CsScore>`;
const signal = () => new AbortController().signal;

beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    files = new Map();
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(new Uint8Array([0, 97, 115, 109])))
    );
    prepare = (await import("./score-preprocessors")).prepareScorePreprocessors;
});
afterEach(() => vi.unstubAllGlobals());

it.each([
    "csbeats",
    "csbeats.wasm",
    "./csbeats",
    "/csbeats",
    "'csbeats'",
    "scot",
    "scot.wasm",
    "./scot",
    "/scot",
    "'scot'"
])("loads the bundled command on demand for %s", async (command) => {
    const abortSignal = signal();
    await prepare(fs, score(command), abortSignal);
    const name = command.includes("csbeats") ? "csbeats" : "scot";
    expect(fetch).toHaveBeenCalledWith(`/${name}.wasm`, {
        signal: abortSignal
    });
    expect(files.get(`${name}.wasm`)).toEqual(
        new Uint8Array([0, 97, 115, 109])
    );
});

it("skips ordinary scores, tag strings, comments and custom command paths", async () => {
    for (const source of [
        undefined,
        "<CsScore>\ni1 0 1\n</CsScore>",
        `<CsInstruments>\nStext = {{\n${score("csbeats")}\n}}\n</CsInstruments>`,
        `<!--\n${score("csbeats")}\n-->`,
        score("tools/uploaded"),
        score("tools/csbeats"),
        score("scsort"),
        score("extract"),
        score("constructor")
    ])
        await prepare(fs, source, signal());
    expect(fetch).not.toHaveBeenCalled();
    expect(fs.readdir).not.toHaveBeenCalled();
});

it.each(["csbeats", "csbeats.wasm", "scot", "scot.wasm"])(
    "preserves an uploaded %s",
    async (name) => {
        const uploaded = new Uint8Array([7]);
        files.set(name, uploaded);
        await prepare(fs, score(name.replace(/\.wasm$/, "")), signal());
        expect(fetch).not.toHaveBeenCalled();
        expect(fs.writeFile).not.toHaveBeenCalled();
        expect(files.get(name)).toBe(uploaded);
    }
);

it("does not replace a project command whose download failed", async () => {
    await prepare(fs, score("csbeats"), signal(), ["csbeats.wasm"]);
    expect(fetch).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
});

it("reuses downloaded bytes across engines", async () => {
    await prepare(fs, score("csbeats"), signal());
    files.clear();
    await prepare(fs, score("csbeats.wasm"), signal());
    expect(fetch).toHaveBeenCalledOnce();
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
});

it("retries a failed download", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 503 }));
    await expect(prepare(fs, score("csbeats"), signal())).rejects.toThrow(
        "Could not load csbeats (503)"
    );
    expect(fs.writeFile).not.toHaveBeenCalled();
    await prepare(fs, score("csbeats"), signal());
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(files.has("csbeats.wasm")).toBe(true);
});

it("cancels downloading and does not cache a cancelled result", async () => {
    const controller = new AbortController();
    vi.mocked(fetch).mockImplementationOnce(async () => {
        controller.abort();
        return new Response(new Uint8Array([1]));
    });
    await expect(
        prepare(fs, score("csbeats"), controller.signal)
    ).rejects.toThrow();
    expect(fs.writeFile).not.toHaveBeenCalled();
    await prepare(fs, score("csbeats"), signal());
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(files.get("csbeats.wasm")).toEqual(
        new Uint8Array([0, 97, 115, 109])
    );
});
