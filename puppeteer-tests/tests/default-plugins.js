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
        `default plugins in ${mode} (SAB: ${useSAB})`,
        { skip: targetName !== "local", timeout: 60000 },
        async () => {
            const browser = await puppeteer.launch(BROWSER_SETTINGS);
            try {
                const page = await browser.newPage();
                const downloads = new Set();
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                page.on("request", (request) => {
                    const name = new URL(request.url()).pathname.match(
                        /\/(chua|image|linear_algebra|stkops)(?:-[\w-]+)?\.wasm$/
                    )?.[1];
                    if (name) downloads.add(name);
                });
                const isolate = async (request) => {
                    if (
                        new URL(request.url()).pathname.endsWith(
                            "/default-plugins.html"
                        )
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
                    } else void request.continue();
                };
                if (useSAB) {
                    await page.setRequestInterception(true);
                    page.on("request", isolate);
                }
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/default-plugins.html`
                );
                if (useSAB) {
                    page.off("request", isolate);
                    await page.setRequestInterception(false);
                }
                await page.waitForFunction(() => !!window.pluginPerformance);
                if (useSAB)
                    assert.equal(
                        await page.evaluate(() => crossOriginIsolated),
                        true
                    );
                if (!useSAB) {
                    const converted = await page.evaluate(() =>
                        window.pluginTool()
                    );
                    assert.match(converted.text, /261\.625565/);
                }
                assert.equal(downloads.size, 0, "tools must not load plugins");
                const result = await page.evaluate(
                    (options) => window.pluginPerformance(options),
                    { mode, useSAB }
                );
                assert.equal(result.failure, undefined, JSON.stringify(result));
                assert.equal(
                    result.reason,
                    "completed",
                    JSON.stringify(result)
                );
                assert.match(result.messages.join("\n"), /plugin norm 5/);
                assert.match(result.messages.join("\n"), /plugin image 2x3/);
                assert.deepEqual([...downloads].sort(), [
                    "chua",
                    "image",
                    "linear_algebra",
                    "stkops"
                ]);
                if (mode === "render") {
                    assert.ok(result.audioBytes > 44);
                    assert.ok(result.peak > 0, "plugins must produce audio");
                }
                assert.deepEqual(errors, []);
            } finally {
                await browser.close();
            }
        }
    );
}
