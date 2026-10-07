import assert from "node:assert/strict";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

for (const [mode, useSAB] of [
    ["play", false],
    ["play", true],
    ["render", false]
])
    test(
        `CSD filenames in ${mode} (SAB: ${useSAB})`,
        { skip: targetName !== "local", timeout: 60000 },
        async () => {
            const browser = await puppeteer.launch(BROWSER_SETTINGS);
            try {
                const page = await browser.newPage();
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.setRequestInterception(true);
                page.on("request", async (request) => {
                    const url = new URL(request.url());
                    if (
                        useSAB &&
                        url.pathname.endsWith("/csd-diagnostics.html")
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
                    `${target.baseUrl}/puppeteer-tests/fixtures/csd-diagnostics.html`
                );
                await page.waitForFunction(() => !!window.compileFixture);
                if (useSAB)
                    assert.equal(
                        await page.evaluate(() => crossOriginIsolated),
                        true
                    );
                for (const error of ["include", "csd", "none"]) {
                    const result = await page.evaluate(
                        (options) => window.compileFixture(options),
                        { mode, useSAB, error }
                    );
                    const output = result.messages.join("\n");
                    if (error === "none") {
                        assert.equal(result.failure, "", output);
                        assert.equal(
                            result.status,
                            mode === "render" ? "completed" : "playing"
                        );
                        if (mode === "render")
                            assert.ok(result.audioBytes > 44);
                        continue;
                    }
                    assert.match(result.failure, /Csound compilation failed/);
                    assert.match(
                        output,
                        /syntax error, unexpected STRING_TOKEN/
                    );
                    if (error === "include")
                        assert.match(output, /from file bid\.udo/);
                    assert.match(
                        output,
                        /from file scores\/my piece\.csd/,
                        output
                    );
                    assert.doesNotMatch(output, /from file \*string\*/);
                }
                assert.deepEqual(errors, []);
            } finally {
                await browser.close();
            }
        }
    );
