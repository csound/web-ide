// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { projectPluginSignatures } from "./project";
import { checkWithPlugins } from "./check";
import { storageReference } from "../../../../config/firestore";
import { MAX_PLUGIN_BYTES } from "./signatures";
import type { IDocument } from "../../../projects/types";
import { pluginMetadata } from "./cache";
vi.mock("../../../../config/firestore", () => ({
    storageReference: vi.fn(async (name) => name)
}));
vi.mock("firebase/storage", () => ({
    getDownloadURL: vi.fn(async () => "https://example.test/plugin")
}));
vi.mock("./cache", () => ({
    pluginMetadata: { get: vi.fn(async (_project, files) => files) }
}));
afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});
const document = (
    documentUid: string,
    filename: string,
    type: IDocument["type"],
    path: string[] = []
): IDocument => ({
    documentUid,
    filename,
    type,
    path,
    userUid: "owner",
    currentValue: "",
    savedValue: "",
    created: 1,
    lastModified: 2,
    isModifiedLocally: false
});
const documents = {
    folder: document("folder", "plugins", "folder"),
    plugin: document("plugin", "voice.wasm", "bin", ["folder"]),
    unused: document("unused", "unused.wasm", "bin")
};
const request = {
    filename: "piece.csd",
    files: [],
    pluginRequests: [{ path: "./plugins/voice.wasm", line: 2 }]
};
it("reads only the named project binary and keys the cache by owner, document and version", async () => {
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(new Uint8Array([0, 97, 115, 109])))
    );
    await projectPluginSignatures("project", documents, request);
    const [project, files] = vi.mocked(pluginMetadata.get).mock.calls[0];
    expect(project).toBe("project");
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({
        name: "plugins/voice.wasm",
        revision: JSON.stringify(["owner", "plugin", 2, 1])
    });
    expect(await files[0].load(new AbortController().signal)).toEqual(
        new Uint8Array([0, 97, 115, 109])
    );
    expect(storageReference).toHaveBeenCalledWith("owner/project/plugin");
    expect(fetch).toHaveBeenCalledTimes(1);
    await expect(
        projectPluginSignatures("project", documents, {
            ...request,
            pluginRequests: [
                {
                    path: "https://example.test/not-a-project-file.wasm",
                    line: 2
                }
            ]
        })
    ).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
});
it("rejects oversized downloads and missing binaries without falling back to unrelated files", async () => {
    vi.stubGlobal(
        "fetch",
        vi.fn(
            async () =>
                new Response(new Uint8Array([1]), {
                    headers: { "content-length": String(MAX_PLUGIN_BYTES + 1) }
                })
        )
    );
    await projectPluginSignatures("project", documents, request);
    const files = vi.mocked(pluginMetadata.get).mock.calls[0][1];
    await expect(files[0].load(new AbortController().signal)).rejects.toThrow(
        "large"
    );
    await expect(
        projectPluginSignatures("project", {}, request)
    ).rejects.toThrow("not in the project");
});
it("reports a missing plugin at its option, avoids false opcode errors, and ignores stale results", async () => {
    const execute = vi.fn(async () => ({ available: true, diagnostics: [] }));
    const result = await checkWithPlugins(
        request,
        new AbortController().signal,
        async () => {
            throw new Error("missing");
        },
        execute
    );
    expect(execute).not.toHaveBeenCalled();
    expect(result).toMatchObject({
        valid: false,
        udosComplete: false,
        plugins: [],
        pluginTypes: [],
        diagnostics: [
            {
                filename: "piece.csd",
                line: 2,
                message: expect.stringContaining(
                    "Could not inspect opcode plugin"
                )
            }
        ]
    });
    const controller = new AbortController();
    await expect(
        checkWithPlugins(
            request,
            controller.signal,
            async () => {
                controller.abort();
                return [];
            },
            execute
        )
    ).rejects.toThrow();
    expect(execute).not.toHaveBeenCalled();
    const resolve = vi.fn(async () => []);
    await checkWithPlugins(
        { ...request, pluginRequests: [] },
        new AbortController().signal,
        resolve,
        execute
    );
    expect(resolve).not.toHaveBeenCalled();
    expect(execute).toHaveBeenCalledWith(
        expect.objectContaining({ plugins: [] }),
        expect.any(AbortSignal)
    );
});
