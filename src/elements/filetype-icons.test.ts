import { describe, expect, it } from "vitest";
import { getFileTypeIconDetails } from "./filetype-icons";

describe("getFileTypeIconDetails", () => {
    it("recognizes WebAssembly files by extension", () => {
        expect(getFileTypeIconDetails("engine.wasm")).toEqual({
            kind: "wasm"
        });
        expect(getFileTypeIconDetails("ENGINE.WASM")).toEqual({
            kind: "wasm"
        });
    });

    it("recognizes WebAssembly files by MIME type", () => {
        expect(
            getFileTypeIconDetails("engine.bin", "application/wasm")
        ).toEqual({ kind: "wasm" });
    });

    it("leaves unrelated binary files on the default icon", () => {
        expect(
            getFileTypeIconDetails("engine.bin", "application/octet-stream")
        ).toBeNull();
    });
});
