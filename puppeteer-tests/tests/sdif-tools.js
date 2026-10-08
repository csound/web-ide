import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

test(
    "SDIF converts on demand, previews edits, and exports playable adsyn data",
    { skip: targetName !== "local", timeout: 90000 },
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const page = await browser.newPage();
            const errors = [],
                wasm = [];
            page.on("pageerror", (error) => errors.push(error.message));
            page.on("request", (request) => {
                if (request.url().endsWith(".wasm")) wasm.push(request.url());
            });
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator.clipboard, "writeText", {
                    value: async (text) => {
                        window.copiedSdif = text;
                    }
                });
            });
            const button = async (label) =>
                (
                    await page.waitForFunction(
                        (label) =>
                            [...document.querySelectorAll("button")].find(
                                (node) => node.textContent.trim() === label
                            ),
                        {},
                        label
                    )
                ).asElement();
            const ready = () =>
                page.waitForFunction(
                    () =>
                        document
                            .querySelector('[aria-label="SDIF converter"]')
                            ?.getAttribute("aria-busy") === "false" &&
                        [...document.querySelectorAll('[role="status"]')].some(
                            (node) => node.textContent.includes("Preview shows")
                        )
                );
            const edit = async (label, value) => {
                await page.click(`[aria-label="${label}"]`, { clickCount: 3 });
                await page.keyboard.type(value);
            };
            await mkdir("screenshots", { recursive: true });
            for (const theme of ["dark", "light"]) {
                wasm.length = 0;
                await page.setViewport({ width: 1100, height: 850 });
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/sdif-tools.html${theme === "light" ? "?light" : ""}`
                );
                await page.click("footer button");
                await page.waitForSelector('[aria-label="Project SDIF file"]');
                assert.deepEqual(wasm, []);
                await (await button("Try example")).click();
                await ready();
                assert.equal(wasm.length, 1);
                assert.match(wasm[0], /sdif2ad.*\.wasm$/);
                await (await button("Copy Csound code")).click();
                await page.waitForFunction(() =>
                    window.copiedSdif?.includes('"example.het"')
                );
                await edit("Gain (dB)", "-6");
                assert.equal(
                    await (
                        await button("Download .het")
                    ).evaluate((node) => node.disabled),
                    true
                );
                await edit("Partial limit", "2");
                await edit("Start (s)", "0.25");
                await edit("End (s)", "1.5");
                await ready();
                assert.equal(
                    await page.$$eval(
                        '[aria-label="Preview partial"] option',
                        (nodes) => nodes.length
                    ),
                    2
                );
                await page.waitForFunction(() =>
                    document.body.textContent.includes("1.250 s.")
                );
                await (await button("Add to project")).click();
                await page.waitForFunction(() =>
                    document
                        .querySelector("pre")
                        ?.textContent.includes('"example-2.het"')
                );
                await (await button("Copy Csound code")).click();
                await page.waitForFunction(() =>
                    window.copiedSdif?.includes('"example-2.het"')
                );
                if (theme === "light") {
                    const render = await page.evaluate(() =>
                        window.renderSdif()
                    );
                    assert.equal(render.finite, true, JSON.stringify(render));
                    assert.ok(render.samples >= 8000, JSON.stringify(render));
                    assert.ok(
                        render.peak > 0 && render.peak < 1,
                        JSON.stringify(render)
                    );
                }
                await edit("End (s)", "0");
                await page.waitForSelector('[role="alert"]');
                assert.equal(
                    await (
                        await button("Download .het")
                    ).evaluate((node) => node.disabled),
                    true
                );
                assert.equal(
                    await page.$('[aria-label="Preview partial"]'),
                    null
                );
                await (await button("Reset settings")).click();
                await ready();
                await page.select('[aria-label="Preview partial"]', "2");
                assert.equal(
                    await page.$$eval("canvas", (nodes) => nodes.length),
                    2
                );
                await page.evaluate(async () => {
                    await Promise.all(
                        document
                            .getAnimations()
                            .map((animation) =>
                                animation.finished.catch(() => {})
                            )
                    );
                });
                await page.screenshot({
                    path: `screenshots/sdif-${theme}.png`
                });
                await page.setViewport({ width: 390, height: 850 });
                assert.equal(
                    await page.evaluate(
                        () => document.documentElement.scrollWidth <= innerWidth
                    ),
                    true
                );
                assert.equal(
                    await page.$eval(
                        ".sdif-layout",
                        (node) =>
                            node.children[1].getBoundingClientRect().top >=
                            node.children[0].getBoundingClientRect().bottom
                    ),
                    true
                );
                await page.screenshot({
                    path: `screenshots/sdif-mobile-${theme}.png`
                });
                await page.select(
                    '[aria-label="Project SDIF file"]',
                    "invalid"
                );
                await page.waitForSelector('[role="alert"]');
                await page.select('[aria-label="Project SDIF file"]', "source");
                await ready();
                assert.equal(await page.$('[role="alert"]'), null);
                await page.select('[aria-label="Project SDIF file"]', "slow");
                await (await button("Cancel")).click();
                await ready();
                await page.select('[aria-label="Project SDIF file"]', "slow");
                await page.click("footer button");
                await page.waitForSelector('[aria-label="SDIF converter"]', {
                    hidden: true
                });
            }
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);
