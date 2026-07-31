import { describe, expect, it, vi } from "vitest";
import type { Csound as BrowserCsoundFactory } from "@csound/browser";
import type { IDocument } from "@comp/projects/types";
import { createCsoundForProject } from "./plugins";

const makeDocument = (overrides: Partial<IDocument>): IDocument => ({
    currentValue: "",
    created: 1,
    documentUid: "document",
    filename: "file.bin",
    lastModified: 1,
    savedValue: "",
    type: "bin",
    userUid: "user",
    isModifiedLocally: false,
    path: [],
    ...overrides
});

const readBlobBytes = (blob: Blob): Promise<number[]> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            resolve(Array.from(new Uint8Array(reader.result as ArrayBuffer)));
        });
        reader.addEventListener("error", () => reject(reader.error));
        reader.readAsArrayBuffer(blob);
    });

describe("createCsoundForProject", () => {
    it("loads every binary .wasm file before initializing Csound", async () => {
        const documents = {
            folder: makeDocument({
                documentUid: "folder",
                filename: "plugins.wasm",
                type: "folder"
            }),
            rootPlugin: makeDocument({
                documentUid: "root-plugin",
                filename: "root.wasm"
            }),
            nestedPlugin: makeDocument({
                documentUid: "nested-plugin",
                filename: "effect.WASM",
                path: ["folder"]
            }),
            audio: makeDocument({
                documentUid: "audio",
                filename: "sample.wav"
            }),
            textWasm: makeDocument({
                documentUid: "text-wasm",
                filename: "notes.wasm",
                type: "txt"
            })
        };
        const rootBytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]);
        const paddedNestedBytes = new Uint8Array([
            255, 0, 97, 115, 109, 1, 0, 0, 0, 255
        ]);
        const nestedBytes = paddedNestedBytes.subarray(1, 9);
        const loadBinaryDocument = vi.fn(
            async (_projectUid: string, document: IDocument) =>
                document.documentUid === "root-plugin" ? rootBytes : nestedBytes
        );
        const blobs: Blob[] = [];
        const createObjectURL = vi.fn((blob: Blob) => {
            blobs.push(blob);
            return `blob:plugin-${blobs.length}`;
        });
        const revokeObjectURL = vi.fn();
        const csoundFactory = vi.fn(async () => {
            expect(revokeObjectURL).not.toHaveBeenCalled();
            return undefined;
        });

        await createCsoundForProject({
            csoundFactory: csoundFactory as unknown as BrowserCsoundFactory,
            loadBinaryDocument,
            projectUid: "project",
            documents,
            options: { useWorker: true },
            createObjectURL,
            revokeObjectURL
        });

        expect(
            loadBinaryDocument.mock.calls.map(([projectUid, document]) => [
                projectUid,
                document.documentUid
            ])
        ).toEqual([
            ["project", "root-plugin"],
            ["project", "nested-plugin"]
        ]);
        expect(csoundFactory).toHaveBeenCalledWith({
            useWorker: true,
            withPlugins: ["blob:plugin-1", "blob:plugin-2"]
        });
        expect(blobs.map((blob) => blob.type)).toEqual([
            "application/wasm",
            "application/wasm"
        ]);
        expect(await Promise.all(blobs.map(readBlobBytes))).toEqual([
            Array.from(rootBytes),
            Array.from(nestedBytes)
        ]);
        expect(revokeObjectURL.mock.calls).toEqual([
            ["blob:plugin-1"],
            ["blob:plugin-2"]
        ]);
    });

    it("revokes plugin URLs when Csound initialization fails", async () => {
        const plugin = makeDocument({ filename: "broken.wasm" });
        const loadBinaryDocument = vi.fn(async () => new Uint8Array([1, 2]));
        const createObjectURL = vi.fn(() => "blob:broken-plugin");
        const revokeObjectURL = vi.fn();
        const csoundFactory = vi.fn(async () => {
            throw new Error("initialization failed");
        });

        await expect(
            createCsoundForProject({
                csoundFactory: csoundFactory as unknown as BrowserCsoundFactory,
                loadBinaryDocument,
                projectUid: "project",
                documents: { plugin },
                options: { useWorker: false },
                createObjectURL,
                revokeObjectURL
            })
        ).rejects.toThrow("initialization failed");

        expect(revokeObjectURL).toHaveBeenCalledWith("blob:broken-plugin");
    });

    it("initializes with an empty plugin list when the project has no plugins", async () => {
        const loadBinaryDocument = vi.fn();
        const csoundFactory = vi.fn(async () => undefined);

        await createCsoundForProject({
            csoundFactory: csoundFactory as unknown as BrowserCsoundFactory,
            loadBinaryDocument,
            projectUid: "project",
            documents: {
                audio: makeDocument({ filename: "sample.wav" })
            },
            options: { useWorker: true }
        });

        expect(loadBinaryDocument).not.toHaveBeenCalled();
        expect(csoundFactory).toHaveBeenCalledWith({
            useWorker: true,
            withPlugins: []
        });
    });
});
