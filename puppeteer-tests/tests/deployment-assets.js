import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { once } from "node:events";
import {
    mkdtemp,
    readFile,
    readdir,
    realpath,
    rm,
    writeFile
} from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { build } from "vite";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, targetName } from "../utils/config.js";
import { retainAssets } from "../../scripts/retain-hosting-assets.mjs";

test(
    "an open editor can load untouched tools after deployment",
    {
        skip: targetName !== "local",
        timeout: 60000
    },
    async () => {
        const root = await realpath(
            await mkdtemp(join(tmpdir(), "csound-deploy-"))
        );
        let browser;
        let server;
        try {
            await writeFile(
                join(root, "index.html"),
                '<textarea id="draft"></textarea><button id="tool">Tool</button><output></output><script type="module" src="/entry.js"></script>'
            );
            await writeFile(
                join(root, "entry.js"),
                `
            document.querySelector('#tool').onclick = async () => {
                try {
                    const { run } = await import('./tool.js');
                    document.querySelector('output').textContent = await run();
                } catch (error) {
                    document.querySelector('output').textContent = error.message;
                }
            };`
            );
            await writeFile(
                join(root, "tool.js"),
                `
            import './tool.css';
            export const run = () => new Promise((resolve, reject) => {
                const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
                worker.onmessage = ({ data }) => { worker.terminate(); resolve(data); };
                worker.onerror = () => { worker.terminate(); reject(new Error('worker failed')); };
            });`
            );
            await writeFile(
                join(root, "worker.js"),
                `
            import url from './tool.wasm?url';
            WebAssembly.instantiateStreaming(fetch(url)).then(({ instance }) =>
                postMessage('version ' + instance.exports.value()));`
            );
            const bundle = async (version) => {
                await writeFile(
                    join(root, "tool.css"),
                    `output { color: rgb(${version}, 0, 0) }`
                );
                // (module (func (export "value") (result i32) i32.const VERSION))
                const wasm = Buffer.from(
                    "0061736d010000000105016000017f030201000709010576616c756500000a0601040041010b",
                    "hex"
                );
                wasm[wasm.length - 2] = version;
                await writeFile(join(root, "tool.wasm"), wasm);
                const outDir = join(root, `v${version}`);
                await build({
                    configFile: false,
                    root,
                    logLevel: "error",
                    worker: { format: "es" },
                    build: { outDir, assetsInlineLimit: 0 }
                });
                return outDir;
            };
            let active = await bundle(1);
            const oldHTML = await readFile(join(active, "index.html"));
            server = createServer(async (request, response) => {
                const pathname = new URL(request.url, "http://localhost")
                    .pathname;
                const stale = pathname === "/old-html";
                const file =
                    pathname === "/" || stale
                        ? "index.html"
                        : pathname.slice(1);
                const type = file.endsWith(".html")
                    ? "text/html"
                    : file.endsWith(".css")
                      ? "text/css"
                      : file.endsWith(".wasm")
                        ? "application/wasm"
                        : "text/javascript";
                response.setHeader("Content-Type", type);
                response.setHeader("Cache-Control", "no-store");
                try {
                    response.end(
                        stale ? oldHTML : await readFile(join(active, file))
                    );
                } catch {
                    response.writeHead(404).end();
                }
            });
            server.listen(0, "127.0.0.1");
            await once(server, "listening");
            const origin = `http://127.0.0.1:${server.address().port}`;
            browser = await puppeteer.launch(BROWSER_SETTINGS);
            const page = await browser.newPage();
            const requests = [];
            page.on("request", (request) => requests.push(request.url()));
            await page.goto(origin);
            assert.equal(
                requests.some((url) => url.endsWith(".wasm")),
                false,
                "WASM stays lazy"
            );
            await page.type("#draft", "unsaved orchestra");
            const next = await bundle(2);
            const files = await Promise.all(
                (await readdir(join(active, "assets"))).map(async (name) => ({
                    path: `/assets/${name}`,
                    hash: createHash("sha256")
                        .update(await readFile(join(active, "assets", name)))
                        .digest("hex")
                }))
            );
            await retainAssets({
                outDir: next,
                files,
                readAsset: async (file) => {
                    const response = await fetch(new URL(file.path, origin));
                    assert.equal(response.status, 200);
                    return Buffer.from(await response.arrayBuffer());
                }
            });
            active = next;
            await page.click("#tool");
            await page.waitForFunction(
                () => document.querySelector("output").textContent
            );
            assert.equal(
                await page.$eval("output", (el) => el.textContent),
                "version 1"
            );
            assert.equal(
                await page.$eval("#draft", (el) => el.value),
                "unsaved orchestra"
            );
            assert.equal(
                await page.$eval("output", (el) => getComputedStyle(el).color),
                "rgb(1, 0, 0)"
            );
            const stale = await browser.newPage();
            await stale.setCacheEnabled(false);
            await stale.goto(`${origin}/old-html`);
            await stale.click("#tool");
            await stale.waitForFunction(
                () => document.querySelector("output").textContent
            );
            assert.equal(
                await stale.$eval("output", (el) => el.textContent),
                "version 1",
                "old HTML can still boot after deployment"
            );
            const fresh = await browser.newPage();
            await fresh.goto(origin);
            await fresh.click("#tool");
            await fresh.waitForFunction(
                () => document.querySelector("output").textContent
            );
            assert.equal(
                await fresh.$eval("output", (el) => el.textContent),
                "version 2"
            );
        } finally {
            await browser?.close();
            if (server) await new Promise((resolve) => server.close(resolve));
            await rm(root, { recursive: true, force: true });
        }
    }
);
