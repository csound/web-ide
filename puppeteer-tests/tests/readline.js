import { strict as assert } from "node:assert";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS } from "../utils/config.js";

test(
    "console readline with local WASM",
    {
        skip: process.env.RUN_READLINE !== "1",
        timeout: 180000
    },
    async () => {
        const base = process.env.READLINE_TEST_URL || "http://localhost:3000";
        assert.ok(
            ["localhost", "127.0.0.1"].includes(new URL(base).hostname),
            "Use a local Vite server for the fixture"
        );
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            for (const variation of [
                {
                    name: "worklet-dark",
                    worker: false,
                    isolated: false,
                    light: false,
                    width: 1100
                },
                {
                    name: "worker-light",
                    worker: true,
                    isolated: false,
                    light: true,
                    width: 1100
                },
                {
                    name: "sab-dark",
                    worker: true,
                    isolated: true,
                    light: false,
                    width: 1100
                },
                {
                    name: "mobile-light",
                    worker: false,
                    isolated: false,
                    light: true,
                    width: 375
                }
            ]) {
                const page = await browser.newPage();
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.setViewport({ width: variation.width, height: 650 });
                const fixture = `${base}/puppeteer-tests/fixtures/readline.html?worker=${variation.worker}&theme=${variation.light ? "light" : "dark"}&empty=${variation.width < 768}`;
                await page.setRequestInterception(true);
                page.on("request", async (request) => {
                    if (request.url() === fixture && variation.isolated) {
                        const response = await fetch(fixture);
                        await request.respond({
                            status: 200,
                            contentType: "text/html",
                            headers: {
                                "Cross-Origin-Opener-Policy": "same-origin",
                                "Cross-Origin-Embedder-Policy": "require-corp"
                            },
                            body: await response.text()
                        });
                    } else if (
                        request.url().startsWith(base) ||
                        request.url().startsWith("data:") ||
                        request.url().startsWith("blob:")
                    ) {
                        await request.continue();
                    } else {
                        await request.abort();
                    }
                });
                await page.goto(fixture);
                await page.waitForSelector("button");
                const input = 'textarea:not([aria-hidden="true"])';
                assert.equal(await page.$(input), null);
                await page.click("button");
                await page.waitForSelector(input, {
                    visible: true,
                    timeout: 30000
                });
                assert.equal(
                    await page.evaluate(() => document.activeElement?.tagName),
                    "TEXTAREA"
                );
                await page.type(input, "héllo");
                await page.keyboard.down("Shift");
                await page.keyboard.press("Enter");
                await page.keyboard.up("Shift");
                await page.type(input, "second");
                assert.equal(
                    await page.$eval(input, (node) => node.value),
                    "héllo\nsecond"
                );
                assert.ok(
                    !(
                        await page.$eval(
                            '[data-testid="console-output"]',
                            (node) => node.textContent
                        )
                    ).includes("Received:")
                );
                await page.keyboard.press("Enter");
                await page.waitForFunction(() =>
                    document
                        .querySelector('[data-testid="console-output"]')
                        .textContent.includes("Received: [second]")
                );
                const output = await page.$eval(
                    '[data-testid="console-output"]',
                    (node) => node.textContent
                );
                assert.ok(
                    output.indexOf("Received: [héllo]") <
                        output.indexOf("Received: [second]"),
                    output
                );
                await page.waitForSelector(`${input}:not(:disabled)`);
                await page.keyboard.press("Enter");
                await page.waitForFunction(() =>
                    document
                        .querySelector('[data-testid="console-output"]')
                        .textContent.includes("Received: []")
                );
                const geometry = await page.evaluate(() => {
                    const logs = document
                        .querySelector(
                            '[data-testid="console-output-container"]'
                        )
                        .getBoundingClientRect();
                    const prompt = document
                        .querySelector('form[aria-label="Csound input"]')
                        .getBoundingClientRect();
                    return {
                        overlap: logs.bottom > prompt.top + 1,
                        overflow:
                            document.documentElement.scrollWidth > innerWidth,
                        promptHeight: prompt.height
                    };
                });
                assert.equal(geometry.overlap, false);
                assert.equal(geometry.overflow, false);
                if (process.env.READLINE_SCREENSHOT_DIR)
                    await page.screenshot({
                        path: `${process.env.READLINE_SCREENSHOT_DIR}/readline-${variation.name}.png`
                    });
                await page.click("header button:last-child");
                await page.waitForFunction(
                    () =>
                        !document.querySelector(
                            'form[aria-label="Csound input"]'
                        )
                );
                await page.waitForSelector(
                    "header button:first-of-type:not(:disabled)"
                );
                await page.click("header button:first-of-type");
                await page.waitForSelector(`${input}:not(:disabled)`);
                assert.equal(await page.$eval(input, (node) => node.value), "");
                assert.ok(
                    !(
                        await page.$eval(
                            '[data-testid="console-output"]',
                            (node) => node.textContent
                        )
                    ).includes("Received:")
                );
                await page.click("header button:last-child");
                assert.deepEqual(errors, []);
                console.log(`${variation.name}: passed`, geometry);
                await page.close();
            }
        } finally {
            await browser.close();
        }
    }
);
