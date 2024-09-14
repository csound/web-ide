import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import EnvironmentPlugin from "vite-plugin-environment";

export default defineConfig({
    // depending on your application, base can also be "/"
    base: "",
    plugins: [
        react({
            jsxImportSource: "@emotion/react",
            babel: {
                plugins: ["@emotion/babel-plugin"]
            }
        }),
        viteTsconfigPaths(),
        svgr(),
        EnvironmentPlugin(["REACT_APP_DATABASE"])
    ],
    server: {
        // this ensures that the browser opens upon server start
        open: true,
        // this sets a default port to 3000
        port: 3000
    }
});
