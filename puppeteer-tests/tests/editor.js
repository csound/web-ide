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
});
