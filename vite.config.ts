import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import checker from "vite-plugin-checker";
import { fileURLToPath } from "node:url";
import { manualPages } from "./scripts/manual-vite";

export default defineConfig({
    define: {
        "process.env.REACT_APP_DATABASE": JSON.stringify(
            process.env.REACT_APP_DATABASE
        )
    },
    // depending on your application, base can also be "/"
    base: "/",
    // Emotion adds its import after scanning; WASI is only discovered in a lazy
    // worker. Prepare both up front so the first audio edit cannot reload the page.
    // This prepares JavaScript only; utility WASM still loads on demand.
    optimizeDeps: {
        include: ["@emotion/styled/base", "@bjorn3/browser_wasi_shim"]
    },
    plugins: [
        manualPages(),
        checker({
            // e.g. use TypeScript check
            typescript: true
        }),
        react({
            jsxImportSource: "@emotion/react",
            babel: {
                plugins: ["@emotion/babel-plugin"]
            }
        }),
        viteTsconfigPaths(),
        svgr()
        // viteRawPlugin({
        //     fileRegex: /\.csd|\.orc\.sco\.udo$/
        // })
    ],
    worker: { format: "es" },
    server: {
        // this ensures that the browser opens upon server start
        open: true,
        // this sets a default port to 3000
        port: 3000
    },
    test: {
        // The browser package has a module entry but no Node main entry.
        alias: {
            "@csound/browser": fileURLToPath(
                new URL(
                    "./node_modules/@csound/browser/dist/csound.js",
                    import.meta.url
                )
            )
        },
        environment: "jsdom",
        include: ["src/**/*.test.{ts,tsx}", "functions/test/**/*.test.ts"]
    }
});
