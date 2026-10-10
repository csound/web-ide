import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

/** Optional local artifact. Never import a missing WASM file into Vite's graph. */
export function csoundChecker(): Plugin {
    const artifacts = [
        ["csound-check", "__CSOUND_CHECK_URL__"],
        ["plugin-types", "__CSOUND_PLUGIN_TYPES_URL__"],
        ["csound-ftgen", "__CSOUND_FTGEN_URL__"]
    ].map(([name, define]) => {
        const path = resolve(`.wasm-build/${name}.wasm`);
        const bytes = existsSync(path) ? readFileSync(path) : undefined;
        const filename = bytes
            ? `assets/${name}-${createHash("sha256").update(bytes).digest("hex").slice(0, 16)}.wasm`
            : undefined;
        return { define, bytes, filename };
    });
    return {
        name: "csound-checker",
        config: () => ({
            define: Object.fromEntries(
                artifacts.map(({ define, filename }) => [
                    define,
                    JSON.stringify(filename ? `/${filename}` : "")
                ])
            )
        }),
        configureServer(server) {
            for (const { bytes, filename } of artifacts) {
                if (!bytes || !filename) continue;
                server.middlewares.use(`/${filename}`, (_request, response) => {
                    response.setHeader("Content-Type", "application/wasm");
                    response.end(bytes);
                });
            }
        },
        generateBundle() {
            for (const { bytes, filename } of artifacts)
                if (bytes && filename)
                    this.emitFile({
                        type: "asset",
                        fileName: filename,
                        source: bytes
                    });
        }
    };
}
