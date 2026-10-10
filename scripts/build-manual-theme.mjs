import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { browserTargets } from "./browser-targets.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
await build({
    root,
    configFile: false,
    publicDir: false,
    logLevel: "warn",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: {
        target: browserTargets,
        outDir: path.resolve(process.argv[2]),
        emptyOutDir: false,
        rolldownOptions: {
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
        target: browserTargets,
        outDir: path.resolve(process.argv[2]),
        emptyOutDir: false,
        rolldownOptions: {
            input: path.join(root, "src/manual/code-preview.ts"),
            preserveEntrySignatures: "strict",
            output: {
                format: "es",
                entryFileNames: "manual-code.js",
                codeSplitting: false
            }
        }
    }
});
