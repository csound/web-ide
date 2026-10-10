import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import svgr from "vite-plugin-svgr";
import checker from "vite-plugin-checker";
import { fileURLToPath } from "node:url";
import { csoundChecker } from "./scripts/csound-check-vite.ts";
import { manualPages } from "./scripts/manual-vite.ts";
import { browserTargets } from "./scripts/browser-targets.mjs";

export default defineConfig({
    define: {
        "process.env.REACT_APP_DATABASE": JSON.stringify(
            process.env.REACT_APP_DATABASE
        )
    },
    // depending on your application, base can also be "/"
    base: "/",
    resolve: { tsconfigPaths: true },
    build: { target: browserTargets },
    // Emotion and the lazy audio workers reveal imports after Vite scans the app.
    // Prebundle their JavaScript in development to avoid a first-use page reload.
    // Production chunks and utility WASM still load only when requested.
    optimizeDeps: {
        include: [
            // Emotion's JSX source replaces React's runtime in plugin-react's
            // includes, but dependencies still import the React runtime.
            "react/jsx-runtime",
            "@emotion/styled/base",
            "@bjorn3/browser_wasi_shim",
            "music-metadata"
        ]
    },
    plugins: [
        manualPages(),
        csoundChecker(),
        checker({
            // e.g. use TypeScript check
            typescript: true
        }),
        react({
            jsxImportSource: "@emotion/react"
        }),
        babel({ plugins: ["@emotion/babel-plugin"] }),
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
        // Transform the spinner's ESM wrapper so its CommonJS styling dependency interoperates in Node.
        server: { deps: { inline: ["react-loader-spinner"] } },
        // The browser package has a module entry but no Node main entry.
        alias: [
            {
                find: /^@csound\/browser$/,
                replacement: fileURLToPath(
                    new URL(
                        "./node_modules/@csound/browser/dist/csound.js",
                        import.meta.url
                    )
                )
            }
        ],
        environment: "jsdom",
        include: ["src/**/*.test.{ts,tsx}", "functions/test/**/*.test.ts"]
    }
});
