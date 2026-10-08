import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

test(
    "HETRO editor converts both ways, validates edits, and loads WASM on demand",
    { skip: targetName !== "local", timeout: 60000 },
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const page = await browser.newPage();
            const errors = [];
            const wasm = new Set();
            page.on("pageerror", (error) => errors.push(error.message));
            page.on("request", (request) => {
                const match = new URL(request.url()).pathname.match(
                    /\/(het_export|het_import)\.wasm$/
                );
                if (match && request.resourceType() === "fetch")
                    wasm.add(match[1]);
            });
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator.clipboard, "writeText", {
                    value: async (text) => {
                        window.copiedHetro = text;
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
                            .querySelector('[aria-label="HETRO editor"]')
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
                    `${target.baseUrl}/puppeteer-tests/fixtures/hetro-tools.html${theme === "light" ? "?light" : ""}`
                );
                await page.click("footer button");
                await page.waitForSelector('[aria-label="HETRO text"]');
                assert.deepEqual([...wasm], []);
                await (await button("Try example")).click();
                await ready();
                assert.deepEqual([...wasm], ["het_import"]);
                const original = await page.evaluate(() => window.readHetro());
                await (await button("Copy text")).click();
                await page.waitForFunction(() => !!window.copiedHetro);
                assert.equal(
                    await page.evaluate(() => window.copiedHetro),
                    original
                );
                await page.evaluate(
                    (text) => window.editHetro(text.replace("16000", "12000")),
                    original
                );
                await page.waitForFunction(() =>
                    [...document.querySelectorAll("button")].some(
                        (node) =>
                            node.textContent.trim() === "Download .het" &&
                            node.disabled
                    )
                );
                await ready();
                await (await button("Add .het to project")).click();
                await page.select(
                    '[aria-label="Project analysis file"]',
                    "saved"
                );
                await ready();
                assert.match(
                    await page.evaluate(() => window.readHetro()),
                    /12000/
                );
                assert.deepEqual([...wasm], ["het_import", "het_export"]);
                await page.evaluate(() =>
                    window.editHetro("HETRO 1,-1,0,1.5\n-2,0,220\n")
                );
                await page.waitForSelector('[role="alert"]');
                assert.equal(
                    await (
                        await button("Download .het")
                    ).evaluate((node) => node.disabled),
                    true
                );
                assert.equal(await page.$('[aria-label="Partial"]'), null);
                await (await button("Reset edits")).click();
                await ready();
                await page.select('[aria-label="Partial"]', "1");
                assert.equal(
                    await page.$$eval("canvas", (nodes) => nodes.length),
                    2
                );
                assert.equal(
                    await (
                        await button("Download .het")
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
                    path: `screenshots/hetro-${theme}.png`
                });
                await page.setViewport({ width: 390, height: 850 });
                assert.equal(
                    await page.evaluate(
                        () => document.documentElement.scrollWidth <= innerWidth
                    ),
                    true
                );
                const stacked = await page.$eval(
                    ".hetro-panes",
                    (node) =>
                        node.children[1].getBoundingClientRect().top >=
                        node.children[0].getBoundingClientRect().bottom
                );
                assert.equal(stacked, true);
                await page.screenshot({
                    path: `screenshots/hetro-mobile-${theme}.png`
                });
                await page.select(
                    '[aria-label="Project analysis file"]',
                    "text"
                );
                await ready();
                assert.equal(
                    await page.evaluate(() => window.readHetro()),
                    original
                );
                await page.evaluate(
                    (text) => window.editHetro(text.replace("16000", "8000")),
                    original
                );
                await page.click("footer button");
                await page.waitForSelector('[aria-label="HETRO editor"]', {
                    hidden: true
                });
            }
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);
