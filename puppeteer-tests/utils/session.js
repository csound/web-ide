/**
 * @module session
 *
 * Shared browser session for Puppeteer E2E tests.
 *
 * Launches a single Chromium instance that is reused across every test file
 * in a `node --test` run.  Each test suite calls {@link getSession} to obtain
 * the browser and a fresh page, then calls {@link closeSession} once when done.
 * The browser is only closed after the last consumer releases it.
 *
 * @example
 * import { getSession, closeSession } from "../utils/session.js";
 *
 * describe("My suite", () => {
 *     let page;
 *     before(async () => { ({ page } = await getSession()); });
 *     after(async () => { await closeSession(); });
 * });
 */

import puppeteer from "puppeteer";
import { BROWSER_SETTINGS } from "./config.js";

/** @type {import('puppeteer').Browser | null} */
let browser = null;

/** Number of active consumers (test suites) sharing the browser. */
let refCount = 0;

/**
 * Acquire a shared browser and create a fresh page.
 *
 * The first call launches Chromium; subsequent calls reuse the same instance.
 * Every page is created with a 1280×900 viewport.
 *
 * @returns {Promise<{ browser: import('puppeteer').Browser, page: import('puppeteer').Page }>}
 */
export async function getSession() {
    if (!browser) {
        browser = await puppeteer.launch(BROWSER_SETTINGS);
    }
    refCount++;

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    return { browser, page };
}

/**
 * Release one consumer's hold on the shared browser.
 *
 * Closes the browser only when the last consumer calls this.  Safe to call
 * multiple times — extra calls after the browser is already closed are no-ops.
 *
 * @returns {Promise<void>}
 */
export async function closeSession() {
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0 && browser) {
        await browser.close();
        browser = null;
    }
}
