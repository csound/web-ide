import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, matchesGlob } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, targetName } from "../utils/config.js";

test(
    "built audio and score workers run under Firebase hosting headers",
    {
        skip: targetName !== "local",
        timeout: 60000
    },
    async () => {
        const root = fileURLToPath(new URL("../../", import.meta.url));
        const hosting = JSON.parse(
            await readFile(join(root, "firebase.json"), "utf8")
        ).hosting;
        const outDir = await mkdtemp(join(tmpdir(), "csound-worker-hosting-"));
        const fixture = "puppeteer-tests/fixtures/worker-hosting.html";
        let browser;
        let server;
        try {
            // Use the real bundled worker and WASM, rather than Vite's dev worker.
            await build({
                configFile: false,
                root,
                logLevel: "error",
                worker: { format: "es" },
                build: {
                    outDir,
                    emptyOutDir: true,
                    rollupOptions: { input: join(root, fixture) }
                }
            });
            server = createServer(async (request, response) => {
                const path = new URL(request.url, "http://localhost").pathname;
                for (const rule of hosting.headers) {
                    if (matchesGlob(path, rule.source)) {
                        for (const { key, value } of rule.headers)
                            response.setHeader(key, value);
                    }
                }
                const file =
                    path === "/editor/worker-hosting" ? fixture : path.slice(1);
                response.setHeader(
                    "Content-Type",
                    file.endsWith(".html")
                        ? "text/html"
                        : file.endsWith(".wasm")
                          ? "application/wasm"
                          : "text/javascript"
                );
                try {
                    response.end(await readFile(join(outDir, file)));
                } catch {
                    response.writeHead(404).end();
                }
            });
            server.listen(0, "127.0.0.1");
            await once(server, "listening");
            browser = await puppeteer.launch(BROWSER_SETTINGS);
            const page = await browser.newPage();
            const wasm = [];
            page.on("request", (request) => {
                if (request.url().endsWith(".wasm")) wasm.push(request.url());
            });
            await page.goto(
                `http://127.0.0.1:${server.address().port}/editor/worker-hosting`
            );
            assert.equal(await page.evaluate(() => crossOriginIsolated), true);
            assert.deepEqual(
                wasm,
                [],
                "WASM must not load before starting a tool"
            );
            await page.click("#generate");
            await page.waitForFunction(
                () => document.querySelector("#result").textContent
            );
            const result = await page.$eval(
                "#result",
                (node) => node.textContent
            );
            assert.match(result, /^RIFF:\d+$/, result);
            assert.ok(
                Number(result.split(":")[1]) > 48000,
                "default sweep has audio data"
            );
            assert.equal(wasm.length, 1, "only the requested tool loads");
            assert.match(wasm[0], /\/mkir-[^/]+\.wasm$/);
            assert.equal(
                await page.evaluate(() => window.roundTripPvx()),
                true
            );
            assert.equal(
                await page.evaluate(() => window.roundTripHetro()),
                true
            );
            for (const name of [
                "pv_import",
                "pv_export",
                "het_import",
                "het_export"
            ])
                assert.ok(
                    wasm.some((url) =>
                        new RegExp(`/${name}-[^/]+\\.wasm$`).test(url)
                    ),
                    `${name} loads on demand`
                );
            const mix = await page.evaluate(() => window.mixAudio());
            assert.deepEqual(mix, { duration: 3, peak: 0.25, channels: 2 });
            assert.ok(wasm.some((url) => /\/mixer-[^/]+\.wasm$/.test(url)));
            for (const program of ["csbeats", "scot", "scsort", "extract"]) {
                const output = await page.evaluate(
                    (program) => window.convertScore(program),
                    program
                );
                assert.match(output, /^i\s*1/m, `${program} produces notes`);
                assert.ok(
                    wasm.some((url) =>
                        new RegExp(`/${program}-[^/]+\\.wasm$`).test(url)
                    ),
                    `${program} loads on demand`
                );
                if (program === "scot") assert.match(output, /8\.00/);
                if (program === "extract")
                    assert.match(output, /^i 1 2 2 1 1 440$/m);
            }
        } finally {
            await browser?.close();
            if (server) {
                server.closeAllConnections();
                await new Promise((resolve) => server.close(resolve));
            }
            await rm(outDir, { recursive: true, force: true });
        }
    }
);
