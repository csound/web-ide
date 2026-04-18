import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
    gotoProject,
    waitForEditor,
    findRunButton,
    activateConsoleTab,
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
            await waitForEditor(page);
        } catch (err) {
            await dumpDebugInfo(page, "editor-before-hook-failure");
            throw err;
        }
    });

    after(async () => {
        await page?.close();
        await closeSession();
    });

    it("mounts the code editor", async () => {
        const editor = await page.$(".cm-editor");
        assert.ok(editor, "Editor not mounted");
    });

    it("has a run button", async () => {
        const btn = await findRunButton(page);
        assert.ok(btn, "Run/play button not found");
    });

    it("runs and produces console output", async () => {
        const btn = await findRunButton(page);
        assert.ok(btn, "Run button not found");
        const beforeLength = await getConsoleOutputLength(page);
        await btn.click();
        await activateConsoleTab(page);
        await waitForConsoleOutputGrowth(page, beforeLength);
        await waitForConsoleOutput(page);
    });
});
