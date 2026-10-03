import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { Plugin, PreviewServer, ViteDevServer } from "vite";

/** Match Firebase's directory indexes without falling back to the React app. */
export function manualPages(): Plugin {
    /** Serve directory indexes from the selected dev or preview output. */
    const mount = (
        server: ViteDevServer | PreviewServer,
        directory: string
    ) => {
        const root = path.resolve(server.config.root, directory, "manual");
        server.middlewares.use((request, response, next) => {
            const url = new URL(request.url || "/", "http://localhost");
            if (
                url.pathname !== "/manual" &&
                !url.pathname.startsWith("/manual/")
            )
                return next();
            let pathname: string;
            try {
                pathname = decodeURIComponent(url.pathname);
            } catch {
                response.statusCode = 400;
                response.end();
                return;
            }
            const file = path.resolve(
                root,
                "." + pathname.slice("/manual".length)
            );
            if (file !== root && !file.startsWith(root + path.sep)) {
                response.statusCode = 404;
                response.end();
                return;
            }
            if (existsSync(file) && statSync(file).isFile()) return next();
            const index = path.join(file, "index.html");
            if (existsSync(index)) {
                if (!url.pathname.endsWith("/")) {
                    response.statusCode = 302;
                    response.setHeader(
                        "Location",
                        url.pathname + "/" + url.search
                    );
                    response.end();
                    return;
                }
                response.setHeader("Content-Type", "text/html; charset=utf-8");
                response.end(readFileSync(index));
            } else {
                response.statusCode = 404;
                response.setHeader("Content-Type", "text/html; charset=utf-8");
                response.end(readFileSync(path.join(root, "404.html")));
            }
        });
    };
    return {
        name: "local-csound-manual",
        configureServer: (server) => mount(server, server.config.publicDir),
        configurePreviewServer: (server) =>
            mount(server, server.config.build.outDir)
    };
}
