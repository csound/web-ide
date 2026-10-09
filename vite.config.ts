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
    // Emotion and the lazy audio workers reveal imports after Vite scans the app.
    // Prebundle their JavaScript in development to avoid a first-use page reload.
    // Production chunks and utility WASM still load only when requested.
    optimizeDeps: {
        include: [
            "@emotion/styled/base",
            "@bjorn3/browser_wasi_shim",
            "music-metadata"
        ]
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
