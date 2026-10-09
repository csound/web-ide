// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CheckerClient } from "./client";
import { MAX_SOURCE_BYTES } from "./source";
import type { CheckRequest, CheckResult } from "./types";

const artifact = ".wasm-build/csound-check.wasm";
const available = existsSync(artifact);
const valid: CheckRequest = {
    filename: "main.orc",
    files: [{ name: "main.orc", text: "instr 1\nprint 1\nendin\n" }]
};
let client: CheckerClient;
let worker: {
    onmessage?: (event: { data: CheckResult }) => void;
    postMessage: ReturnType<typeof vi.fn>;
    terminate: ReturnType<typeof vi.fn>;
};

beforeEach(async () => {
    vi.resetModules();
    const scope = {
        onmessage: undefined as
            | ((event: { data: CheckRequest }) => Promise<void>)
            | undefined,
        postMessage: (data: CheckResult) => worker.onmessage?.({ data })
    };
    worker = {
        postMessage: vi.fn(
            (data: CheckRequest) => void scope.onmessage?.({ data })
        ),
        terminate: vi.fn()
    };
    vi.stubGlobal("self", scope);
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(readFileSync(artifact)))
    );
    await import("./check.worker");
    client = new CheckerClient(() => worker as unknown as Worker);
});
afterEach(() => {
    client?.dispose();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

it("disables checks after a WASM trap", async () => {
    // A module with exported memory and an _start that executes unreachable.
    const trap = Buffer.from(
        "0061736d01000000010401600000030201000503010001071302066d656d6f72790200065f737461727400000a05010300000b",
        "hex"
    );
    vi.mocked(fetch).mockResolvedValueOnce(new Response(trap));
    const signal = new AbortController().signal;
    const first = client.check(valid, signal);
    const pending = client.check(valid, signal);
    expect(await first).toEqual({ available: false, diagnostics: [] });
    expect(await pending).toEqual({ available: false, diagnostics: [] });
    await client.check(valid, signal);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
});

it.skipIf(!available).each([
    [
        "UTF-8 size limit",
        {
            files: [
                {
                    name: "main.orc",
                    text: "音".repeat(Math.floor(MAX_SOURCE_BYTES / 3) + 1)
                }
            ]
        }
    ],
    ["invalid path", { files: [{ name: "../main.orc", text: "" }] }],
    [
        "conflicting paths",
        {
            files: [
                { name: "folder", text: "" },
                { name: "folder/main.orc", text: "" }
            ]
        }
    ],
    [
        "reverse conflicting paths",
        {
            files: [
                { name: "folder/main.orc", text: "" },
                { name: "folder", text: "" }
            ]
        }
    ],
    [
        "plugin signatures",
        { plugins: [{ opname: "", outypes: "a", intypes: "k" }] }
    ],
    [
        "plugin types",
        { pluginTypes: [{ name: "", argtype: 0, struct: false, members: [] }] }
    ]
] satisfies [string, Partial<CheckRequest>][])(
    "rejects %s without disabling the next queued check",
    async (_reason, input) => {
        const signal = new AbortController().signal;
        const rejected = client.check({ ...valid, ...input }, signal);
        const next = client.check(valid, signal);
        expect(await rejected).toEqual({
            available: false,
            rejected: true,
            diagnostics: []
        });
        expect(await next).toMatchObject({ available: true, valid: true });
        expect(worker.terminate).not.toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledTimes(1);
    }
);

it("disables checks when the checker cannot load", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    const signal = new AbortController().signal;
    expect(await client.check(valid, signal)).toEqual({
        available: false,
        diagnostics: []
    });
    expect(await client.check(valid, signal)).toEqual({
        available: false,
        diagnostics: []
    });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
});
