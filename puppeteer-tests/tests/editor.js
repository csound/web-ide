import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
    gotoProject,
    waitForProject,
    openFileFromTree,
    findRunButton,
    openConsolePanel,
    waitForConsoleOutput,
    getConsoleOutputLength,
    waitForConsoleOutputGrowth,
    attachPageDebugListeners,
    dumpDebugInfo
} from "../utils/browser.js";
import { getSession, closeSession } from "../utils/session.js";
import { targetName } from "../utils/config.js";

describe(`Editor [${targetName}]`, () => {
    let page;

    before(async () => {
        ({ page } = await getSession());
        attachPageDebugListeners(page);
        await gotoProject(page);
        try {
            await waitForProject(page);
        } catch (err) {
            await dumpDebugInfo(page, "editor-before-hook-failure");
            throw err;
        }
    });

    after(async () => {
        await page?.close();
        await closeSession();
    });

    it("shows the file tree with project files", async () => {
        const tree = await page.$('[data-testid="file-tree"]');
        assert.ok(tree, "File tree not mounted");
    });

    it("opens a file and mounts the code editor", async () => {
        try {
            await openFileFromTree(page, "project.csd");
        } catch (err) {
            await dumpDebugInfo(page, "editor-open-file-failure");
            throw err;
        }
        const editor = await page.$(".cm-editor");
        assert.ok(editor, "Editor not mounted after clicking file");
    });

    it("has a run button", async () => {
        const btn = await findRunButton(page);
        assert.ok(btn, "Run/play button not found");
    });

    it("shows the console panel below the editor by default", async () => {
        const consoleOutput = await page.$('[data-testid="console-output"]');
        assert.ok(consoleOutput, "Console panel not mounted by default");

        const launcherIsActive = await page.$eval(
            '[data-testid="sidebar-bottom-console"]',
            (el) => el.getAttribute("aria-pressed") === "true"
        );
        assert.equal(launcherIsActive, true, "Console launcher is not active");
    });

    it("runs and produces console output", async () => {
        const btn = await findRunButton(page);
        assert.ok(btn, "Run button not found");
        await openConsolePanel(page);
        const consoleOutput = await page.$('[data-testid="console-output"]');
        assert.ok(consoleOutput, "Console panel not mounted before run");
        const beforeLength = await getConsoleOutputLength(page);
        await btn.click();
        await waitForConsoleOutputGrowth(page, beforeLength);
        await waitForConsoleOutput(page);
    });

    for (const { line, input, opcode } of [
        { line: "; scroll test ", input: "typing", opcode: "" },
        { line: "aTest oscili 0.2, 440", input: "0", opcode: "oscili" },
        { line: "aTest ", input: "oscili 0.2, 440", opcode: "oscili" },
        { line: "aTest oscili 0.2, 440", input: " ; comment", opcode: "" }
    ]) {
        it(`keeps the caret and scroll position when typing ${JSON.stringify(input)} after ${JSON.stringify(line)}`, async () => {
            // Edits stay in this signed-out browser session; do not save them.
            const source = [
                "<CsoundSynthesizer>",
                "<CsInstruments>",
                "instr 1",
                ...Array.from({ length: 60 }, () => "; padding"),
                line,
                ...Array.from({ length: 60 }, () => "; padding"),
                "endin",
                "</CsInstruments>",
                "</CsoundSynthesizer>"
            ].join("\n");
            await page.focus(".cm-content");
            const modifier = process.platform === "darwin" ? "Meta" : "Control";
            await page.keyboard.down(modifier);
            await page.keyboard.press("a");
            await page.keyboard.up(modifier);
            await page.keyboard.sendCharacter(source);
            await page.$eval(".cm-scroller", (scroller) => {
                scroller.scrollTop =
                    63 *
                        Number.parseFloat(
                            getComputedStyle(scroller).lineHeight
                        ) -
                    scroller.clientHeight / 2;
            });
            await page.waitForFunction(
                (text) =>
                    [...document.querySelectorAll(".cm-line")].some(
                        (line) => line.textContent === text
                    ),
                {},
                line
            );
            const point = await page.evaluate((text) => {
                const line = [...document.querySelectorAll(".cm-line")].find(
                    (line) => line.textContent === text
                );
                const range = document.createRange();
                range.selectNodeContents(line);
                const rect = range.getBoundingClientRect();
                return { x: rect.right + 2, y: (rect.top + rect.bottom) / 2 };
            }, line);
            await page.mouse.click(point.x, point.y);
            // Let selection, parsing, and async opcode help settle, then center
            // the caret. The initial selection can itself trigger this bug.
            await new Promise((resolve) => setTimeout(resolve, 300));
            await page.evaluate(() => {
                const scroller = document.querySelector(".cm-scroller");
                const caret = document.querySelector(".cm-cursor");
                scroller.scrollTop +=
                    caret.getBoundingClientRect().top -
                    scroller.getBoundingClientRect().top -
                    scroller.clientHeight / 2;
            });
            const readPosition = () =>
                page.evaluate(() => {
                    const scroller = document.querySelector(".cm-scroller");
                    const caret = document
                        .querySelector(".cm-cursor")
                        .getBoundingClientRect();
                    const bounds = scroller.getBoundingClientRect();
                    return {
                        scrollTop: scroller.scrollTop,
                        visible:
                            caret.top >= bounds.top &&
                            caret.bottom <= bounds.bottom
                    };
                });
            await new Promise((resolve) => setTimeout(resolve, 100));
            const before = await readPosition();
            assert.ok(before.visible, "Caret must start inside the editor");
            for (const character of input) {
                await page.keyboard.type(character);
                await new Promise((resolve) => setTimeout(resolve, 60));
                const after = await readPosition();
                assert.ok(
                    after.visible,
                    "Typing scrolled the caret out of view"
                );
                assert.ok(
                    Math.abs(after.scrollTop - before.scrollTop) <= 1,
                    `Typing moved scrollTop from ${before.scrollTop} to ${after.scrollTop}`
                );
            }
            await page.waitForFunction(
                (opcode) =>
                    (document.querySelector(
                        ".cm-csound-synopsis .cm-csound-opcode"
                    )?.textContent ?? "") === opcode,
                {},
                opcode
            );
            assert.equal(
                await page.$eval(".cm-activeLine", (line) => line.textContent),
                line + input,
                "The keystrokes must reach the selected line"
            );
        });
    }
});
