import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

for (const [platform, modifier, light] of [
    ["MacIntel", "Meta", false],
    ["Win32", "Control", true],
    ["Linux x86_64", "Control", false]
]) {
    test(
        `Find and replace in the focused editor on ${platform}`,
        {
            skip: targetName !== "local",
            timeout: 45000
        },
        async () => {
            const browser = await puppeteer.launch(BROWSER_SETTINGS);
            const page = await browser.newPage();
            page.setDefaultTimeout(10000);
            try {
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.evaluateOnNewDocument((platform) => {
                    Object.defineProperty(navigator, "platform", {
                        get: () => platform
                    });
                }, platform);
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/editor-find.html${light ? "?light" : ""}`
                );
                await page.waitForSelector(
                    '[data-editor="second"] .cm-content'
                );
                const pressFind = async () => {
                    await page.keyboard.down(modifier);
                    await page.keyboard.press("f");
                    await page.keyboard.up(modifier);
                };
                const second = '[data-editor="second"]';
                await page.click(`${second} .cm-content`);
                await pressFind();
                assert.ok(
                    await page.$(`${second} .cm-search`),
                    "Find must open inside the focused editor"
                );
                assert.equal(
                    await page.$('[data-editor="first"] .cm-search'),
                    null
                );
                assert.equal(
                    await page.evaluate(
                        () => window.editorFindFixture.lastFindPrevented
                    ),
                    true
                );
                assert.equal(
                    await page.evaluate(() =>
                        document.activeElement?.getAttribute("name")
                    ),
                    "search"
                );
                await page.keyboard.type("alpha");
                await page.click(`${second} input[name="case"]`);
                await page.click(`${second} input[name="word"]`);
                await page.waitForFunction(
                    () =>
                        document.querySelectorAll(
                            '[data-editor="second"] .cm-searchMatch'
                        ).length === 2
                );
                await page.click(`${second} button[name="next"]`);
                assert.equal(
                    await page.evaluate(() =>
                        window.editorFindFixture.selection("second")
                    ),
                    "alpha"
                );
                const firstMatch = await page.evaluate(
                    () => window.editorFindFixture.ranges("second")[0].from
                );
                await page.keyboard.press("F3");
                assert.notEqual(
                    await page.evaluate(
                        () => window.editorFindFixture.ranges("second")[0].from
                    ),
                    firstMatch
                );
                await page.keyboard.down("Shift");
                await page.keyboard.press("F3");
                await page.keyboard.up("Shift");
                assert.equal(
                    await page.evaluate(
                        () => window.editorFindFixture.ranges("second")[0].from
                    ),
                    firstMatch
                );
                // Find again selects the existing query for replacement.
                await pressFind();
                await page.keyboard.type("tone(\\d+)");
                await page.click(`${second} input[name="re"]`);
                await page.type(`${second} input[name="replace"]`, "voice$1");
                await page.click(`${second} button[name="replaceAll"]`);
                await page.waitForFunction(() =>
                    window.editorFindFixture
                        .text("second")
                        .includes("voice12 voice34")
                );
                assert.equal(
                    await page.evaluate(() =>
                        window.editorFindFixture.text("first")
                    ),
                    "; untouched alpha\ninstr 1\n  aSignal oscili 0.1, 440\nendin"
                );
                await page.click(`${second} input[name="search"]`);
                await page.keyboard.press("Escape");
                assert.equal(await page.$(`${second} .cm-search`), null);
                assert.equal(
                    await page.evaluate(() =>
                        document.activeElement?.classList.contains("cm-content")
                    ),
                    true
                );

                // Repeated Find focuses the same panel; Escape and Undo retain normal editing.
                await pressFind();
                await pressFind();
                assert.equal((await page.$$(`${second} .cm-search`)).length, 1);
                await page.keyboard.press("Escape");
                await page.keyboard.down(modifier);
                await page.keyboard.press("z");
                await page.keyboard.up(modifier);
                await page.waitForFunction(() =>
                    window.editorFindFixture
                        .text("second")
                        .includes("tone12 tone34")
                );

                const press = async (keys, key) => {
                    for (const modifier of keys)
                        await page.keyboard.down(modifier);
                    await page.keyboard.press(
                        /^[a-z]$/.test(key) ? `Key${key.toUpperCase()}` : key
                    );
                    for (const modifier of [...keys].reverse())
                        await page.keyboard.up(modifier);
                };
                // Select repeated text without opening Find, then go to a line.
                await page.evaluate(() =>
                    window.editorFindFixture.select("second", 2, 7)
                );
                await press([modifier], "d");
                assert.equal(
                    await page.evaluate(
                        () => window.editorFindFixture.ranges("second").length
                    ),
                    2
                );
                await page.evaluate(() =>
                    window.editorFindFixture.select("second", 2, 7)
                );
                await press([modifier, "Shift"], "l");
                assert.equal(
                    await page.evaluate(
                        () => window.editorFindFixture.ranges("second").length
                    ),
                    3
                );
                await press([modifier, "Alt"], "g");
                await page.waitForSelector(`${second} .cm-goto-line input`);
                await page.keyboard.type("3");
                await page.keyboard.press("Enter");
                await page.waitForFunction(
                    () => window.editorFindFixture.cursorLine("second") === 3
                );

                const first = '[data-editor="first"]';
                await page.focus(`${first} .cm-content`);
                await page.evaluate(() =>
                    window.editorFindFixture.select("first", 18)
                );
                const foldModifiers =
                    modifier === "Meta"
                        ? ["Meta", "Alt"]
                        : ["Control", "Shift"];
                await press(foldModifiers, "BracketLeft");
                await page.waitForSelector(`${first} .cm-foldPlaceholder`);
                await press(foldModifiers, "BracketRight");
                assert.equal(
                    await page.$(`${first} .cm-foldPlaceholder`),
                    null
                );
                await press(["Control", "Alt"], "BracketLeft");
                assert.ok(await page.$(`${first} .cm-foldPlaceholder`));
                await press(["Control", "Alt"], "BracketRight");
                assert.equal(
                    await page.$(`${first} .cm-foldPlaceholder`),
                    null
                );

                await page.evaluate(() =>
                    window.editorFindFixture.select("first", 26)
                );
                const beforePair = await page.evaluate(() =>
                    window.editorFindFixture.text("first")
                );
                await page.keyboard.type("(");
                assert.equal(
                    await page.evaluate(() =>
                        window.editorFindFixture.text("first")
                    ),
                    beforePair.slice(0, 26) + "()" + beforePair.slice(26)
                );
                await page.keyboard.press("Backspace");
                assert.equal(
                    await page.evaluate(() =>
                        window.editorFindFixture.text("first")
                    ),
                    beforePair
                );

                await page.evaluate(() => {
                    window.editorFindFixture.select("first", 0);
                    window.editorFindFixture.diagnostics();
                });
                await page.keyboard.press("F8");
                assert.equal(
                    await page.evaluate(() =>
                        window.editorFindFixture.selection("first")
                    ),
                    "untouched"
                );
                await page.keyboard.press("F8");
                assert.equal(
                    await page.evaluate(() =>
                        window.editorFindFixture.selection("first")
                    ),
                    "alpha"
                );
                await press([modifier, "Shift"], "m");
                await page.waitForSelector(`${first} .cm-panel-lint`);
                assert.match(
                    await page.$eval(
                        `${first} .cm-panel-lint`,
                        (panel) => panel.textContent
                    ),
                    /Example error/
                );
                await page.keyboard.press("Escape");
                assert.equal(await page.$(`${first} .cm-panel-lint`), null);

                for (const id of ["tool-source", "tool-output"]) {
                    await page.focus(`[data-editor="${id}"] .cm-content`);
                    await pressFind();
                    assert.ok(await page.$(`[data-editor="${id}"] .cm-search`));
                    const replace = await page.$(
                        `[data-editor="${id}"] input[name="replace"]`
                    );
                    assert.equal(Boolean(replace), id === "tool-source");
                    await page.keyboard.press("Escape");
                }
                await page.focus('input[aria-label="Outside editor"]');
                await pressFind();
                assert.equal(
                    await page.evaluate(
                        () => window.editorFindFixture.lastFindPrevented
                    ),
                    false
                );
                assert.equal((await page.$$(".cm-search")).length, 0);
                await page.keyboard.press("Escape");

                await page.setViewport({ width: 360, height: 800 });
                await page.focus(`${second} .cm-content`);
                await pressFind();
                assert.ok(
                    await page.$eval(
                        `${second} .cm-search`,
                        (panel) => panel.scrollWidth <= panel.clientWidth
                    )
                );
                assert.deepEqual(errors, []);
            } finally {
                const screenshots = new URL("../screenshots/", import.meta.url);
                await mkdir(screenshots, { recursive: true });
                await page.screenshot({
                    path: `${screenshots.pathname}editor-find-${platform.replaceAll(" ", "-")}.png`,
                    fullPage: true
                });
                await browser.close();
            }
        }
    );
}
