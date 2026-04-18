import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { launchBrowser, newPage, goto } from "../utils/browser.js";
import { targetName } from "../utils/config.js";

describe(`Home [${targetName}]`, () => {
    let browser, page;

    before(async () => {
        browser = await launchBrowser();
        page = await newPage(browser);
        await goto(page, "/");
    });

    after(async () => {
        await browser?.close();
    });

    it("loads with a non-empty title", async () => {
        const title = await page.title();
        assert.ok(title.length > 0, "Page title should not be empty");
    });

    it("renders page content", async () => {
        const text = await page.evaluate(() => document.body.innerText);
        assert.ok(
            text.trim().length > 50,
            "Body text too short — possible blank page"
        );
    });
});
