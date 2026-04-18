import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
    gotoProject,
    waitForEditor,
    findRunButton,
    activateConsoleTab,
    waitForConsoleOutput
} from "../utils/browser.js";
import { getSession, closeSession } from "../utils/session.js";
import { targetName } from "../utils/config.js";

describe(`Editor [${targetName}]`, () => {
    let page;

    before(async () => {
        ({ page } = await getSession());
        await gotoProject(page);
    });

    after(async () => {
        await closeSession();
    });

    it("mounts the code editor", async () => {
        await waitForEditor(page);
    });

    it("has a run button", async () => {
        const btn = await findRunButton(page);
        assert.ok(btn, "Run/play button not found");
    });

    it("runs and produces console output", async () => {
        const btn = await findRunButton(page);
        await btn.click();
        await activateConsoleTab(page);
        await waitForConsoleOutput(page);
    });
});
