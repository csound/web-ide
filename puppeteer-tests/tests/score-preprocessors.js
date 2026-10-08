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
                let scotDownloads = 0;
                await page.setRequestInterception(true);
                page.on("request", async (request) => {
                    const url = new URL(request.url());
                    if (
                        url.pathname.endsWith("/scot.wasm") &&
                        request.resourceType() === "fetch"
                    )
                        scotDownloads++;
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
                assert.equal(
                    scotDownloads,
                    0,
                    "other notations must not load SCOT"
                );
                assert.match(
                    await run({ command: "scot" }),
                    /generated pitch 8\.00/
                );
                assert.equal(scotDownloads, 1);
                assert.match(
                    await run({ command: "./scot.wasm" }),
                    /generated pitch 8\.00/
                );
                assert.equal(scotDownloads, 1, "reuse SCOT across engines");
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

test(
    "score converter runs on demand and updates both panes",
    { skip: targetName !== "local", timeout: 60000 },
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const page = await browser.newPage();
            // Match the manual's copy test without changing the host clipboard.
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator.clipboard, "writeText", {
                    value: async (text) => {
                        window.copiedScore = text;
                    }
                });
            });
            const downloads = new Set();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            page.on("request", (request) => {
                const name = new URL(request.url()).pathname.match(
                    /\/(csbeats|scot|scsort|extract)\.wasm$/
                )?.[1];
                if (name && request.resourceType() === "fetch")
                    downloads.add(name);
            });
            await page.goto(
                `${target.baseUrl}/puppeteer-tests/fixtures/score-tools.html`
            );
            await page.waitForSelector("footer button");
            assert.equal(downloads.size, 0);
            await page.click("footer button");
            const ready = async () => {
                await page.waitForFunction(() =>
                    document
                        .querySelector('.score-footer[role="status"]')
                        ?.textContent.includes("Up to date")
                );
                return page.evaluate(() => window.readScore());
            };
            const beats = await ready();
            assert.match(beats, /261\.625565/);
            assert.deepEqual([...downloads], ["csbeats"]);
            assert.equal(
                await page.$$eval(".cm-score-pitch", (nodes) => nodes.length),
                4
            );
            await page.click(".score-output button");
            await page.waitForFunction(
                () =>
                    document.querySelector(".score-output button")
                        ?.textContent === "Copied"
            );
            assert.equal(await page.evaluate(() => window.copiedScore), beats);
            await page.select('select[aria-label="Source language"]', "scot");
            assert.match(await ready(), /8\.00/);
            assert.deepEqual([...downloads], ["csbeats", "scot"]);
            await page.evaluate(() =>
                window.editScore(
                    "orchestra { voice=1 }\nscore { $voice 4c nonsense }"
                )
            );
            await page.waitForSelector('[role="alert"]');
            assert.equal(await page.evaluate(() => window.readScore()), "");
            assert.equal(
                await page.$eval(
                    ".score-output button",
                    (button) => button.disabled
                ),
                true
            );
            await page.evaluate(() =>
                window.editScore("orchestra { voice=1 }\nscore { $voice 4d }")
            );
            assert.match(await ready(), /8\.02/);
            // The next edit immediately hides the old score; the worker starts after the debounce.
            await page.evaluate(() =>
                window.editScore("orchestra { voice=1 }\nscore { $voice 4e }")
            );
            assert.equal(
                await page.$eval(
                    ".score-output button",
                    (button) => button.disabled
                ),
                true
            );
            assert.match(await ready(), /8\.04/);
            await page.select('select[aria-label="Source language"]', "scsort");
            const sorted = await ready();
            assert.ok(sorted.indexOf("220") < sorted.indexOf("330"));
            assert.ok(sorted.indexOf("330") < sorted.indexOf("440"));
            await page.select(
                'select[aria-label="Source language"]',
                "extract"
            );
            const extracted = await ready();
            assert.doesNotMatch(extracted, /^i 2/m);
            assert.match(extracted, /^i 1 0 0 1 1 220$/m);
            assert.match(extracted, /^i 1 2 2 1 1 440$/m);
            assert.deepEqual(
                [...downloads],
                ["csbeats", "scot", "scsort", "extract"]
            );
            // Each language keeps its draft when switching back.
            await page.select('select[aria-label="Source language"]', "scot");
            assert.match(await ready(), /8\.04/);
            await page.setViewport({ width: 390, height: 700 });
            assert.equal(
                await page.evaluate(
                    () => document.documentElement.scrollWidth <= innerWidth
                ),
                true
            );
            await page.evaluate(() =>
                window.editScore("orchestra { voice=1 }\nscore { $voice 4f }")
            );
            await page.click("footer button");
            await page.waitForSelector('[aria-label="Score converter"]', {
                hidden: true
            });
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);
