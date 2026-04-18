/**
 * templates/example.js
 *
 * Starter template for a new route-based test file.
 * Copy this file into tests/, rename it to match your route,
 * and replace the placeholder tests with real assertions.
 *
 * Run with:  npm test
 * Debug with: HEADLESS=false npm test
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { goto } from "../utils/browser.js";
import { getSession, closeSession } from "../utils/session.js";
import { targetName } from "../utils/config.js";

/**
 * Replace "Example" with the route name, e.g. "Profile", "Login".
 * The [${targetName}] suffix shows which environment ran (local/dev/prod).
 */
describe(`Example [${targetName}]`, () => {
    let page;

    // ── Setup: runs once before all tests in this describe block ─────
    before(async () => {
        ({ page } = await getSession());
        await goto(page, "/"); // change to your route, e.g. '/profile'
    });

    // ── Teardown: runs once after all tests ──────────────────────────
    after(async () => {
        await page?.close();
        await closeSession();
    });

    // ── Tests ────────────────────────────────────────────────────────

    it("has a non-empty page title", async () => {
        const title = await page.title();
        assert.ok(title.length > 0, "Page title should not be empty");
    });

    it("renders a specific element", async () => {
        // Wait for an element to appear in the DOM
        const el = await page.waitForSelector("h1", { timeout: 10000 });
        assert.ok(el, "Expected an <h1> element on the page");
    });

    it("element contains expected text", async () => {
        // Read text content from an element
        const text = await page.$eval("h1", (el) => el.textContent);
        assert.ok(text.includes("Csound"), 'Heading should contain "Csound"');
    });

    it("clicking a button triggers a change", async () => {
        // Find and click a button
        const btn = await page.$('button[aria-label="some action"]');
        assert.ok(btn, "Button not found");
        await btn.click();

        // Wait for a DOM change after the click
        await page.waitForSelector(".result-panel", { timeout: 5000 });
    });

    it("evaluates a condition in the browser", async () => {
        // Run arbitrary JS in the page context
        const hasContent = await page.evaluate(() => {
            return document.body.innerText.trim().length > 0;
        });
        assert.ok(hasContent, "Page body should have text content");
    });
});
