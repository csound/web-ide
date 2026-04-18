import puppeteer from "puppeteer";
import { target, TIMEOUT, BROWSER_SETTINGS } from "./config.js";

/**
 * Launch a headless Chromium instance.
 * @returns {Promise<import('puppeteer').Browser>}
 */
export async function launchBrowser() {
    return puppeteer.launch(BROWSER_SETTINGS);
}

/**
 * Create a new page with a 1280×900 viewport.
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<import('puppeteer').Page>}
 */
export async function newPage(browser) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    return page;
}

/**
 * Navigate to a path on the current target's base URL.
 * @param {import('puppeteer').Page} page
 * @param {string} [path=''] - Route path, e.g. '/' or '/profile'.
 */
export async function goto(page, path = "") {
    await page.goto(`${target.baseUrl}${path}`, {
        waitUntil: "networkidle2",
        timeout: TIMEOUT.NAVIGATION
    });
}

/**
 * Navigate to the target's pre-configured project editor URL.
 * @param {import('puppeteer').Page} page
 */
export async function gotoProject(page) {
    await page.goto(target.projectUrl, {
        waitUntil: "networkidle2",
        timeout: TIMEOUT.NAVIGATION
    });
}

/**
 * Wait for the CodeMirror 6 editor to mount.
 * @param {import('puppeteer').Page} page
 * @param {number} [timeout=TIMEOUT.EDITOR] - Max wait in ms.
 */
export async function waitForEditor(page, timeout = TIMEOUT.EDITOR) {
    await page.waitForSelector(".cm-editor", { timeout });
}

/**
 * Find the run/play button in the editor toolbar.
 * @param {import('puppeteer').Page} page
 * @returns {Promise<import('puppeteer').ElementHandle | null>}
 */
export async function findRunButton(page) {
    return page.$(
        'div[aria-label*="play" i] button, div[aria-label*="run" i] button, ' +
            'button[aria-label*="run" i], button[aria-label*="play" i], ' +
            'button[title*="run" i], button[title*="play" i]'
    );
}

/**
 * Click the Console/Output tab if it exists.
 * @param {import('puppeteer').Page} page
 */
export async function activateConsoleTab(page) {
    const tab = await page.evaluateHandle(() => {
        const els = Array.from(
            document.querySelectorAll('[role="tab"], button')
        );
        return (
            els.find((el) => /console|output/i.test(el.textContent || "")) ||
            null
        );
    });
    const exists = await page.evaluate((el) => !!el, tab);
    if (exists) await tab.click();
}

/**
 * Wait until the console panel contains non-empty text output.
 * @param {import('puppeteer').Page} page
 * @param {number} [timeout=TIMEOUT.CONSOLE_OUTPUT] - Max wait in ms.
 */
export async function waitForConsoleOutput(
    page,
    timeout = TIMEOUT.CONSOLE_OUTPUT
) {
    await page.waitForFunction(
        () => {
            const el = document.querySelector(
                '[role="tabpanel"] code, [class*="console"] span, [class*="Console"] span'
            );
            return el && el.textContent.trim().length > 0;
        },
        { timeout }
    );
}
