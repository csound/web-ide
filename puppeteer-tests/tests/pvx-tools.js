import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

test(
    "PVX editor converts both ways, validates edits, and loads WASM on demand",
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
                    /\/(pv_export|pv_import)\.wasm$/
                );
                if (match && request.resourceType() === "fetch")
                    wasm.add(match[1]);
            });
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator.clipboard, "writeText", {
                    value: async (text) => {
                        window.copiedPvx = text;
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
                            .querySelector('[aria-label="PVX editor"]')
                            ?.getAttribute("aria-busy") === "false" &&
                        [...document.querySelectorAll('[role="status"]')].some(
                            (node) =>
                                node.textContent.includes("Preview matches")
                        )
                );
            const editAndWait = async (text) => {
                // Observe this edit's pending state before waiting for its result.
                // Otherwise ready() can still see the previous conversion.
                await page.evaluate((text) => {
                    const editor = document.querySelector(
                        '[aria-label="PVX editor"]'
                    );
                    return new Promise((resolve) => {
                        const observer = new MutationObserver(() => {
                            if (editor.getAttribute("aria-busy") !== "true")
                                return;
                            observer.disconnect();
                            resolve();
                        });
                        observer.observe(editor, {
                            attributes: true,
                            attributeFilter: ["aria-busy"]
                        });
                        window.editPvx(text);
                    });
                }, text);
                await ready();
            };
            await mkdir("screenshots", { recursive: true });
            for (const theme of ["dark", "light"]) {
                wasm.clear();
                await page.setViewport({ width: 1100, height: 800 });
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/pvx-tools.html${theme === "light" ? "?light" : ""}`
                );
                await page.click("footer button");
                await page.waitForSelector('[aria-label="PVX text"]');
                assert.deepEqual([...wasm], []);
                await (await button("Try example")).click();
                await ready();
                assert.deepEqual([...wasm], ["pv_import"]);
                const original = await page.evaluate(() => window.readPvx());
                await (await button("Copy text")).click();
                await page.waitForFunction(() => !!window.copiedPvx);
                assert.equal(
                    await page.evaluate(() => window.copiedPvx),
                    original
                );
                const rows = original.trim().split("\n");
                const cells = rows[4].split(",");
                cells[6] = "0.125";
                rows[4] = cells.join(",");
                const edited = rows.join("\n") + "\n";
                await page.evaluate((text) => window.editPvx(text), edited);
                await page.waitForFunction(() =>
                    [...document.querySelectorAll("button")].some(
                        (node) =>
                            node.textContent.trim() === "Download .pvx" &&
                            node.disabled
                    )
                );
                await ready();
                await (await button("Add .pvx to project")).click();
                await page.select(
                    '[aria-label="Project analysis file"]',
                    "saved"
                );
                await ready();
                assert.match(
                    await page.evaluate(() => window.readPvx()),
                    /0\.125/
                );
                assert.deepEqual([...wasm], ["pv_import", "pv_export"]);
                await page.evaluate(() => window.editPvx("invalid"));
                await page.waitForSelector('[role="alert"]');
                assert.equal(
                    await (
                        await button("Download .pvx")
                    ).evaluate((node) => node.disabled),
                    true
                );
                assert.equal(await page.$('[aria-label="Frame number"]'), null);
                await (await button("Reset edits")).click();
                await ready();
                await page.click('[aria-label="Frame number"]', {
                    count: 3
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
                    () => window.selectedPvxRow() === 21
                );
                const stereoRows = edited.trim().split("\n");
                const wave = stereoRows[1].split(",").map(Number);
                wave[1] = 2;
                wave[3] *= 2;
                wave[4] *= 2;
                stereoRows[1] = wave.join(",");
                const stereo = "\n\n" + stereoRows.join("\n") + "\n";
                await editAndWait(stereo);
                await page.select('[aria-label="Channel"]', "1");
                await editAndWait(stereo + "\n");
                assert.deepEqual(
                    await page.evaluate(() => [
                        document.querySelector('[aria-label="Frame number"]')
                            .value,
                        document.querySelector('[aria-label="Channel"]').value
                    ]),
                    ["17", "1"]
                );
                await (await button("Show text row")).click();
                await page.waitForFunction(
                    () => window.selectedPvxRow() === 40
                );
                assert.equal(
                    await page.evaluate(() =>
                        document.body.textContent.includes("Text row 40.")
                    ),
                    true
                );
                const underflowRows = [...stereoRows];
                const underflowCells = underflowRows[4].split(",");
                underflowCells[0] = "1e-400";
                underflowRows[4] = underflowCells.join(",");
                await page.evaluate(
                    (text) => window.editPvx(text),
                    underflowRows.join("\n")
                );
                await page.waitForFunction(() =>
                    document
                        .querySelector('[role="alert"]')
                        ?.textContent.includes("float range")
                );
                assert.equal(
                    await (
                        await button("Add .pvx to project")
                    ).evaluate((node) => node.disabled),
                    true
                );
                await editAndWait(stereo);
                assert.deepEqual(
                    await page.evaluate(() => [
                        document.querySelector('[aria-label="Frame number"]')
                            .value,
                        document.querySelector('[aria-label="Channel"]').value
                    ]),
                    ["17", "1"]
                );
                assert.equal(
                    await (
                        await button("Download .pvx")
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
                    path: `screenshots/pvx-${theme}.png`
                });
                await page.setViewport({ width: 390, height: 850 });
                assert.equal(
                    await page.evaluate(
                        () => document.documentElement.scrollWidth <= innerWidth
                    ),
                    true
                );
                const stacked = await page.$eval(
                    ".pvx-panes",
                    (node) =>
                        node.children[1].getBoundingClientRect().top >=
                        node.children[0].getBoundingClientRect().bottom
                );
                assert.equal(stacked, true);
                await page.screenshot({
                    path: `screenshots/pvx-mobile-${theme}.png`
                });
                await page.select(
                    '[aria-label="Project analysis file"]',
                    "text"
                );
                await ready();
                assert.equal(
                    await page.evaluate(() => window.readPvx()),
                    original
                );
                assert.deepEqual(
                    await page.evaluate(() => [
                        document.querySelector('[aria-label="Frame number"]')
                            .value,
                        document.querySelector('[aria-label="Channel"]').value
                    ]),
                    ["1", "0"]
                );
                await page.evaluate(
                    (text) => window.editPvx(text + "\n"),
                    original
                );
                await page.click("footer button");
                await page.waitForSelector('[aria-label="PVX editor"]', {
                    hidden: true
                });
            }
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);
