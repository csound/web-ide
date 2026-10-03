import { strict as assert } from "node:assert";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS } from "../utils/config.js";

test(
    "playback shortcuts and toolbar with real Csound",
    {
        skip: process.env.RUN_SHORTCUTS !== "1",
        timeout: 180000
    },
    async () => {
        const base = process.env.SHORTCUTS_TEST_URL || "http://localhost:3000";
        assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            // This checks platform-dependent bindings; it does not emulate Safari.
            for (const [platform, worker] of [
                ["MacIntel", false],
                ["iPad", true],
                ["Linux x86_64", false]
            ]) {
                const page = await browser.newPage();
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.evaluateOnNewDocument((value) => {
                    Object.defineProperty(navigator, "platform", {
                        get: () => value
                    });
                }, platform);
                await page.setRequestInterception(true);
                page.on("request", (request) => {
                    const url = request.url();
                    if (
                        url.startsWith(base) ||
                        url.startsWith("blob:") ||
                        url.startsWith("data:")
                    )
                        void request.continue();
                    else void request.abort();
                });
                await page.goto(
                    `${base}/puppeteer-tests/fixtures/keyboard-shortcuts.html?worker=${worker}`
                );
                const waitStatus = async (status) => {
                    try {
                        await page.waitForFunction(
                            (value) =>
                                document.querySelector('[data-testid="status"]')
                                    ?.textContent === value,
                            {},
                            status
                        );
                    } catch (error) {
                        assert.fail(
                            `${platform}: expected ${status}; ${await page.$eval("body", (node) => node.innerText)}; ${errors.join("; ")}; ${error.message}`
                        );
                    }
                };
                const press = async (modifier, key) => {
                    await page.click(".cm-content");
                    await page.keyboard.down(modifier);
                    await page.keyboard.press(key);
                    await page.keyboard.up(modifier);
                };
                await waitStatus("initialized");
                await press("Control", "p");
                await waitStatus("initialized");
                await press("Control", "r");
                await waitStatus("playing");
                await page.waitForFunction(() =>
                    document
                        .querySelector('[data-testid="console-output"]')
                        ?.textContent.includes("Csound version")
                );
                const originalOutput = await page.$eval(
                    '[data-testid="console-output"]',
                    (node) => node.textContent
                );
                for (const modifier of platform === "Linux x86_64"
                    ? ["Control"]
                    : ["Control", "Meta"]) {
                    await press(modifier, "p");
                    await waitStatus("paused");
                    await press(modifier, "p");
                    await waitStatus("playing");
                    await press(modifier, "p");
                    await waitStatus("paused");
                    await press(modifier, "r");
                    await waitStatus("playing");
                }
                await page.click('[data-testid="run-button"]');
                await waitStatus("paused");
                await page.click('[data-testid="run-button"]');
                await waitStatus("playing");
                assert.equal(
                    await page.$eval(
                        '[data-testid="console-output"]',
                        (node) => node.textContent
                    ),
                    originalOutput
                );
                await page.click("button:not([data-testid])");
                await waitStatus("stopped");
                assert.deepEqual(errors, []);
                console.log(`${platform}, worker=${worker}: passed`);
                await page.close();
            }
        } finally {
            await browser.close();
        }
    }
);
