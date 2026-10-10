import assert from "node:assert/strict";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

test(
    "plugin object and struct types reach diagnostics and completion through the worker",
    {
        skip: targetName !== "local",
        timeout: 45000
    },
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const page = await browser.newPage();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            await page.goto(
                `${target.baseUrl}/puppeteer-tests/fixtures/plugin-check.html`
            );
            await page.waitForFunction(() => window.pluginFixture);
            if (
                !(await page.evaluate(
                    () =>
                        window.pluginFixture.available &&
                        window.pluginFixture.typesAvailable
                ))
            )
                return;
            await page.evaluate(() => window.pluginFixture.useTypes());
            await page.waitForFunction(
                () =>
                    window.pluginFixture.types().length ||
                    window.pluginFixture.diagnostics().length
            );
            assert.deepEqual(
                await page.evaluate(() => window.pluginFixture.diagnostics()),
                []
            );
            assert.deepEqual(
                await page.evaluate(() => window.pluginFixture.types().sort()),
                [":PluginPair;", "PluginVoice"]
            );
            await page.evaluate(() => window.pluginFixture.completeType());
            await page.waitForSelector(".cm-tooltip-autocomplete");
            assert.match(
                await page.$eval(
                    ".cm-tooltip-autocomplete",
                    (node) => node.textContent
                ),
                /PluginVoice/
            );
            await page.keyboard.press("Escape");
            const initialProbes = await page.evaluate(() =>
                window.pluginFixture.probes()
            );
            await page.evaluate(() =>
                window.pluginFixture.edit(
                    window.pluginFixture
                        .text()
                        .replace("pair.level", "pair.missing")
                )
            );
            await page.waitForFunction(() =>
                window.pluginFixture
                    .diagnostics()
                    .some((message) => message.includes("missing"))
            );
            assert.equal(
                await page.evaluate(() => window.pluginFixture.probes()),
                initialProbes
            );
            await page.evaluate(() =>
                window.pluginFixture.edit(
                    window.pluginFixture
                        .text()
                        .replace("--opcode-lib=types.wasm", "")
                )
            );
            await page.waitForFunction(
                () => window.pluginFixture.types().length === 0
            );
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);

test(
    "plugin metadata is lazy, cached, shared by editor features, and replaced with the binary",
    { skip: targetName !== "local", timeout: 45000 },
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const page = await browser.newPage();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            await page.goto(
                `${target.baseUrl}/puppeteer-tests/fixtures/plugin-check.html`
            );
            await page.waitForFunction(() => window.pluginFixture);
            if (!(await page.evaluate(() => window.pluginFixture.available)))
                return;
            assert.equal(
                await page.evaluate(() => window.pluginFixture.probes()),
                0
            );
            await page.waitForFunction(
                () =>
                    window.pluginFixture.entries().length ||
                    window.pluginFixture.diagnostics().length
            );
            assert.deepEqual(
                await page.evaluate(() =>
                    window.pluginFixture.entries().sort()
                ),
                ["hello440", "mult"],
                JSON.stringify(
                    await page.evaluate(() =>
                        window.pluginFixture.diagnostics()
                    )
                )
            );
            assert.deepEqual(
                await page.evaluate(() => window.pluginFixture.diagnostics()),
                []
            );
            assert.equal(
                await page.evaluate(() => window.pluginFixture.reads()),
                2
            );
            assert.equal(
                await page.evaluate(() => window.pluginFixture.probes()),
                1
            );
            assert.ok(
                await page.$$eval(".cm-csound-opcode", (nodes) =>
                    nodes.some((node) => node.textContent === "mult")
                )
            );
            await page.evaluate(() => window.pluginFixture.complete());
            await page.waitForSelector(".cm-tooltip-autocomplete");
            assert.match(
                await page.$eval(
                    ".cm-tooltip-autocomplete",
                    (node) => node.textContent
                ),
                /hello440/
            );
            await page.waitForFunction(() =>
                document
                    .querySelector(".cm-csound-synopsis")
                    ?.textContent.includes("hello440")
            );
            await page.keyboard.press("Escape");
            await page.evaluate(() =>
                window.pluginFixture.edit(
                    window.pluginFixture
                        .text()
                        .replace("hello440()", "hello440(123)")
                )
            );
            await page.waitForFunction(() =>
                window.pluginFixture
                    .diagnostics()
                    .some((message) => message.includes("hello440"))
            );
            assert.equal(
                await page.evaluate(() => window.pluginFixture.probes()),
                1
            );
            assert.equal(
                await page.evaluate(() => window.pluginFixture.reads()),
                2
            );
            await page.evaluate(() =>
                window.pluginFixture.edit(
                    window.pluginFixture
                        .text()
                        .replace("c.wasm,cpp.wasm", "cpp.wasm")
                        .replace("hello440(123)", "hello440()")
                )
            );
            await page.waitForFunction(
                () =>
                    JSON.stringify(window.pluginFixture.entries()) ===
                    '["hello440"]'
            );
            await page.evaluate(() => window.pluginFixture.replacePlugin());
            await page.waitForFunction(
                () =>
                    JSON.stringify(window.pluginFixture.entries()) ===
                    '["mult"]'
            );
            await page.waitForFunction(() =>
                window.pluginFixture
                    .diagnostics()
                    .some((message) => message.includes("hello440"))
            );
            await page.evaluate(() =>
                window.pluginFixture.edit(
                    window.pluginFixture
                        .text()
                        .replace("--opcode-lib=cpp.wasm", "")
                )
            );
            await page.waitForFunction(
                () => window.pluginFixture.entries().length === 0
            );
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);
