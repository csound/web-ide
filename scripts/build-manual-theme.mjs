import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
await build({
    root,
    configFile: false,
    publicDir: false,
    logLevel: "warn",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: {
        outDir: path.resolve(process.argv[2]),
        emptyOutDir: false,
        rollupOptions: {
            onwarn(warning, warn) {
                // This static bundle has no server/client component boundary.
                if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
                warn(warning);
            }
        },
        lib: {
            entry: path.join(root, "src/styles/manual-page-theme.ts"),
            name: "ManualTheme",
            formats: ["iife"],
            fileName: () => "manual-theme.js"
        }
    }
});

await build({
    root,
    configFile: false,
    publicDir: false,
    logLevel: "warn",
    build: {
        outDir: path.resolve(process.argv[2]),
        emptyOutDir: false,
        rollupOptions: {
            input: path.join(root, "src/manual/code-preview.ts"),
            preserveEntrySignatures: "strict",
            output: {
                format: "es",
                entryFileNames: "manual-code.js",
                inlineDynamicImports: true
            }
        }
    }
});
