import assert from "node:assert/strict";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

for (const [mode, useSAB] of [
    ["play", false],
    ["play", true],
    ["render", false]
]) {
    test(
        `score preprocessors in ${mode} (SAB: ${useSAB})`,
        { skip: targetName !== "local", timeout: 60000 },
        async () => {
            const browser = await puppeteer.launch(BROWSER_SETTINGS);
            try {
                const page = await browser.newPage();
                let downloads = 0;
                await page.setRequestInterception(true);
                page.on("request", async (request) => {
                    const url = new URL(request.url());
                    if (
                        url.pathname.endsWith("/csbeats.wasm") &&
                        request.resourceType() === "fetch"
                    )
                        downloads++;
                    if (
                        useSAB &&
                        url.pathname.endsWith("/score-preprocessors.html")
                    ) {
                        const response = await fetch(request.url());
                        await request.respond({
                            status: response.status,
                            contentType: "text/html",
                            headers: {
                                "Cross-Origin-Opener-Policy": "same-origin",
                                "Cross-Origin-Embedder-Policy": "require-corp"
                            },
                            body: await response.text()
                        });
                    } else if (
                        url.origin === new URL(target.baseUrl).origin ||
                        ["blob:", "data:"].includes(url.protocol)
                    )
                        void request.continue();
                    else void request.abort();
                });
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/score-preprocessors.html`
                );
                await page.waitForFunction(() => !!window.scoreFixture);
                if (useSAB)
                    assert.equal(
                        await page.evaluate(() => crossOriginIsolated),
                        true
                    );
                const run = async (options) => {
                    const result = await page.evaluate(
                        (options) => window.scoreFixture(options),
                        { mode, useSAB, ...options }
                    );
                    assert.equal(
                        result.failure,
                        undefined,
                        JSON.stringify(result)
                    );
                    if (mode === "render") assert.ok(result.audioBytes > 44);
                    return result.messages.join("\n");
                };
                await run({});
                assert.equal(
                    downloads,
                    0,
                    "ordinary scores must not download csbeats"
                );
                // First prove the published browser package runs a supplied WASM file.
                assert.match(
                    await run({ command: "tools/uploaded", uploaded: true }),
                    /generated frequency 261\.6256/
                );
                const before = downloads;
                assert.match(
                    await run({ command: "csbeats" }),
                    /generated frequency 261\.6256/
                );
                assert.equal(downloads, before + 1);
                assert.match(
                    await run({ command: "csbeats.wasm" }),
                    /generated frequency 261\.6256/
                );
                assert.equal(
                    downloads,
                    before + 1,
                    "reuse the downloaded binary for the next run"
                );
                const failed = await page.evaluate(
                    (options) => window.scoreFixture(options),
                    { mode, useSAB, command: "csbeats", uploaded: "failure" }
                );
                // The uploaded program exits with status 7. Replacing it with
                // the bundled csbeats would incorrectly make this compile pass.
                assert.match(failed.failure, /Csound compilation failed/);
                assert.doesNotMatch(
                    failed.messages.join("\n"),
                    /Cannot run score command/
                );
                assert.equal(
                    downloads,
                    before + 1,
                    "never replace the uploaded command"
                );
            } finally {
                await browser.close();
            }
        }
    );
}
