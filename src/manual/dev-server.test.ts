// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { manualPages } from "../../scripts/manual-vite";

let root: string;
beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "csound-manual-server-"));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

function request(mode: "dev" | "preview", url: string) {
    let handler: any;
    const plugin = manualPages();
    const hook =
        mode === "dev" ? plugin.configureServer : plugin.configurePreviewServer;
    if (typeof hook !== "function") throw new Error("Missing server hook");
    hook.call(
        {} as never,
        {
            config: { root, publicDir: "public", build: { outDir: "dist" } },
            middlewares: {
                use: (middleware: any) => {
                    handler = middleware;
                }
            }
        } as never
    );
    const response = { statusCode: 200, setHeader: vi.fn(), end: vi.fn() };
    const next = vi.fn();
    handler({ url }, response, next);
    return { response, next };
}

it.each(["dev", "preview"] as const)(
    "returns a plain 404 when generated manual files are absent in %s",
    (mode) => {
        const { response, next } = request(mode, "/manual/lookup.json");
        expect(response.statusCode).toBe(404);
        expect(response.end).toHaveBeenCalledWith(
            expect.stringContaining("Manual page not found")
        );
        expect(next).not.toHaveBeenCalled();
    }
);

it.each(["dev", "preview"] as const)(
    "keeps the generated manual 404 page in %s",
    (mode) => {
        const directory = path.join(
            root,
            mode === "dev" ? "public" : "dist",
            "manual"
        );
        mkdirSync(directory, { recursive: true });
        writeFileSync(
            path.join(directory, "404.html"),
            "<h1>Custom manual 404</h1>"
        );
        const { response } = request(mode, "/manual/no-such-opcode/");
        expect(response.statusCode).toBe(404);
        expect(response.end.mock.calls[0][0].toString()).toBe(
            "<h1>Custom manual 404</h1>"
        );
    }
);
