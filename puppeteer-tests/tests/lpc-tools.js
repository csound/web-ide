import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

test(
    "LPC editor converts both ways, validates edits, and keeps conversion off the UI thread",
    { skip: targetName !== "local", timeout: 60000 },
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const page = await browser.newPage();
            const errors = [];
            const wasm = new Set();
            page.on("pageerror", (error) => errors.push(error.message));
            page.on("request", (request) => {
                if (request.url().endsWith(".wasm")) wasm.add(request.url());
            });
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator.clipboard, "writeText", {
                    value: async (text) => {
                        window.copiedLpc = text;
                    }
                });
            });
            const button = async (label) => {
                const handle = await page.waitForFunction(
                    (label) =>
                        [...document.querySelectorAll("button")].find(
                            (node) => node.textContent.trim() === label
                        ),
                    {},
                    label
                );
                return handle.asElement();
            };
            const ready = () =>
                page.waitForFunction(
                    () =>
                        document
                            .querySelector('[aria-label="LPC editor"]')
                            ?.getAttribute("aria-busy") === "false" &&
                        [...document.querySelectorAll('[role="status"]')].some(
                            (node) =>
                                node.textContent.includes("Preview matches")
                        )
                );
            await mkdir("screenshots", { recursive: true });
            for (const theme of ["dark", "light"]) {
                wasm.clear();
                await page.setViewport({ width: 1100, height: 800 });
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/lpc-tools.html${theme === "light" ? "?light" : ""}`
                );
                await page.click("footer button");
                await page.waitForSelector('[aria-label="LPC text"]');
                assert.deepEqual([...wasm], []);
                await (await button("Try example")).click();
                await ready();
                assert.deepEqual([...wasm], []);
                const original = await page.evaluate(() => window.readLpc());
                await (await button("Copy text")).click();
                await page.waitForFunction(() => !!window.copiedLpc);
                assert.equal(
                    await page.evaluate(() => window.copiedLpc),
                    original
                );
                const rows = original.trim().split("\n");
                const cells = rows[5].split(",");
                cells[0] = "0.125";
                rows[5] = cells.join(",");
                const edited = rows.join("\n") + "\n";
                await page.evaluate((text) => window.editLpc(text), edited);
                await page.waitForFunction(() =>
                    [...document.querySelectorAll("button")].some(
                        (node) =>
                            node.textContent.trim() === "Download .lpc" &&
                            node.disabled
                    )
                );
                await ready();
                await (await button("Add .lpc to project")).click();
                await page.select(
                    '[aria-label="Project analysis file"]',
                    "saved"
                );
                await ready();
                assert.match(
                    await page.evaluate(() => window.readLpc()),
                    /0\.125/
                );
                assert.deepEqual([...wasm], []);
                if (theme === "light") {
                    for (const poles of [false, true]) {
                        const rendered = await page.evaluate(
                            (poles) => window.renderLpc(poles),
                            poles
                        );
                        assert.equal(rendered.finite, true);
                        assert.ok(rendered.samples >= 400);
                        assert.ok(
                            rendered.peak > 0 && rendered.peak < 1,
                            JSON.stringify(rendered)
                        );
                        assert.match(
                            rendered.messages.join("\n"),
                            /LPC pitch (180|220)/
                        );
                    }
                }
                await page.evaluate(() => window.editLpc("invalid"));
                await page.waitForSelector('[role="alert"]');
                assert.equal(
                    await (
                        await button("Download .lpc")
                    ).evaluate((node) => node.disabled),
                    true
                );
                assert.equal(await page.$('[aria-label="Frame number"]'), null);
                await (await button("Reset edits")).click();
                await ready();
                await page.click('[aria-label="Frame number"]', {
                    clickCount: 3
                });
                await page.keyboard.type("17");
                await page.waitForFunction(
                    () =>
                        document.querySelector('[aria-label="Frame number"]')
                            .value === "17"
                );
                assert.equal(
                    await page.$$eval("canvas", (nodes) => nodes.length),
                    1
                );
                await (await button("Show text row")).click();
                await page.waitForFunction(
                    () => window.selectedLpcRow() === 22
                );
                assert.equal(
                    await (
                        await button("Download .lpc")
                    ).evaluate((node) => node.disabled),
                    false
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
                    path: `screenshots/lpc-${theme}.png`
                });
                await page.setViewport({ width: 390, height: 850 });
                assert.equal(
                    await page.evaluate(
                        () => document.documentElement.scrollWidth <= innerWidth
                    ),
                    true
                );
                const stacked = await page.$eval(
                    ".lpc-panes",
                    (node) =>
                        node.children[1].getBoundingClientRect().top >=
                        node.children[0].getBoundingClientRect().bottom
                );
                assert.equal(stacked, true);
                await page.screenshot({
                    path: `screenshots/lpc-mobile-${theme}.png`
                });
                await page.select(
                    '[aria-label="Project analysis file"]',
                    "text"
                );
                await ready();
                assert.equal(
                    await page.evaluate(() => window.readLpc()),
                    original
                );
                await page.evaluate(
                    (text) => window.editLpc(text + "\n"),
                    original
                );
                await page.click("footer button");
                await page.waitForSelector('[aria-label="LPC editor"]', {
                    hidden: true
                });
            }
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);
