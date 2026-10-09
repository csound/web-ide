import assert from "node:assert/strict";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

test(
    "background Csound diagnostics and optional WASM",
    { skip: targetName !== "local", timeout: 30000 },
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const page = await browser.newPage();
            const errors = [];
            const downloads = [];
            page.on("pageerror", (error) => errors.push(error.message));
            page.on("request", (request) => {
                if (/\/assets\/csound-check-.*\.wasm$/.test(request.url()))
                    downloads.push(request.url());
            });
            await page.goto(
                `${target.baseUrl}/puppeteer-tests/fixtures/csound-check.html`
            );
            await page.waitForFunction(() =>
                window.checkerFixture?.text().includes("instr Lead")
            );
            const available = await page.evaluate(
                () => window.checkerFixture.available
            );
            if (available) {
                assert.equal(
                    await page.evaluate(() => window.checkerFixture.count()),
                    0
                );
                assert.equal(downloads.length, 0);
                await page.waitForFunction(
                    () => window.checkerFixture.count() === 1
                );
                assert.equal(downloads.length, 1);
                assert.equal(
                    await page
                        .$$(".cm-lint-marker-error")
                        .then((items) => items.length),
                    1
                );
                assert.equal(
                    await page.$eval(
                        ".cm-lintRange-error",
                        (node) => node.textContent
                    ),
                    ")"
                );
                await page.hover(".cm-lint-marker-error");
                await page.waitForSelector(".cm-tooltip-lint");
                const tooltip = await page.$eval(
                    ".cm-tooltip-lint",
                    (node) => node.textContent
                );
                assert.match(tooltip, /syntax error/);
                assert.doesNotMatch(tooltip, /Csound|line \d|columns? \d/);
                await page.evaluate(() =>
                    window.checkerFixture.edit(
                        window.checkerFixture
                            .text()
                            .replace("oscili(", "osciliii(")
                    )
                );
                await page.waitForFunction(
                    () => window.checkerFixture.count() === 2
                );
                assert.deepEqual(
                    await page.$$eval(".cm-lintRange-error", (nodes) =>
                        nodes.map((node) => node.textContent)
                    ),
                    ["osciliii", ")"]
                );
                await page.evaluate(() =>
                    window.checkerFixture.edit(
                        window.checkerFixture
                            .text()
                            .replace("osciliii(", "oscili(")
                            .replace("0.1, )", "0.1, frequency)")
                    )
                );
                assert.equal(
                    await page.evaluate(() => window.checkerFixture.count()),
                    0
                );
                // A second real response proves that the same worker can check again.
                await page.evaluate(() =>
                    window.checkerFixture.edit(
                        window.checkerFixture
                            .text()
                            .replace("oscili", "missingOpcode")
                    )
                );
                await page.waitForFunction(
                    () => window.checkerFixture.count() === 1
                );
                assert.equal(downloads.length, 1);
            } else {
                await page.evaluate(() => window.checkerFixture.compileError());
                assert.equal(
                    await page.evaluate(() => window.checkerFixture.count()),
                    1
                );
                await page.evaluate(() =>
                    window.checkerFixture.edit(
                        window.checkerFixture
                            .text()
                            .replace("0.1, )", "0.1, frequency)")
                    )
                );
                assert.equal(
                    await page.evaluate(() => window.checkerFixture.count()),
                    0
                );
                assert.equal(downloads.length, 0);
            }
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);

test(
    "included UDOs share completion and synopsis and keep confirmed symbols on failure",
    {
        skip: targetName !== "local",
        timeout: 30000
    },
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const page = await browser.newPage();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            await page.goto(
                `${target.baseUrl}/puppeteer-tests/fixtures/csound-check.html?udos`
            );
            await page.waitForFunction(() => window.checkerFixture);
            if (!(await page.evaluate(() => window.checkerFixture.available)))
                return;
            await page.waitForFunction(() =>
                window.checkerFixture.udos().includes("IncludedVoice")
            );
            await page.evaluate(() => window.checkerFixture.complete());
            await page.waitForSelector(".cm-tooltip-autocomplete");
            assert.match(
                await page.$eval(
                    ".cm-tooltip-autocomplete",
                    (node) => node.textContent
                ),
                /IncludedVoice\(frequency:i\)/
            );
            await page.waitForFunction(() =>
                document
                    .querySelector(".cm-csound-synopsis")
                    ?.textContent.includes("frequency:i")
            );
            await page.keyboard.press("Escape");

            // A failed check can reveal a new header but must keep the prior global name.
            await page.evaluate(() =>
                window.checkerFixture.include(
                    "opcode DraftVoice(pitch:k):a\na1 = oscili(0.1, )\nxout a1\nendop\n"
                )
            );
            await page.waitForFunction(() =>
                window.checkerFixture.udos().includes("DraftVoice")
            );
            assert.deepEqual(
                await page.evaluate(() => window.checkerFixture.udos().sort()),
                ["DraftVoice", "IncludedVoice"]
            );

            // A complete successful check replaces that set, removing the old name.
            await page.evaluate(() => {
                window.checkerFixture.include(
                    "opcode RenamedVoice(pitch:i):a\nxout oscili(0.1, pitch)\nendop\n"
                );
                window.checkerFixture.edit(
                    window.checkerFixture
                        .text()
                        .replace("IncludedVoice(440)", "RenamedVoice(440)")
                );
            });
            await page.waitForFunction(
                () =>
                    JSON.stringify(window.checkerFixture.udos()) ===
                    '["RenamedVoice"]'
            );
            await page.evaluate(() =>
                window.checkerFixture.edit(
                    window.checkerFixture
                        .text()
                        .replace('#include "voice.udo"', "")
                        .replace("RenamedVoice(440)", "oscili(0.1, 440)")
                )
            );
            await page.waitForFunction(
                () => window.checkerFixture.udos().length === 0
            );
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);
