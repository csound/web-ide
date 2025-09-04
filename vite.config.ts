import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import checker from "vite-plugin-checker";
import viteRawPlugin from "vite-raw-plugin";

export default defineConfig({
    define: {
        "process.env.REACT_APP_DATABASE": JSON.stringify(
            process.env.REACT_APP_DATABASE
        )
    },
    // depending on your application, base can also be "/"
    base: "/",
    plugins: [
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
        svgr(),
        viteRawPlugin({
            fileRegex: /\.csd|\.orc\.sco\.udo$/
        })
    ],
    server: {
        // this ensures that the browser opens upon server start
        open: true,
        // this sets a default port to 3000
        port: 3000
    }
});
