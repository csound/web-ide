import { target, targetName, TIMEOUT } from "./config.js";

const RUN_BUTTON_SELECTOR = '[data-testid="run-button"]';
const CONSOLE_TAB_SELECTOR = '[data-testid="console-tab"]';
const CONSOLE_OUTPUT_SELECTOR = '[data-testid="console-output"]';

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
 *
 * For local (Vite dev server), navigate directly — Vite serves index.html
 * for all routes via SPA fallback, so React Router handles it natively.
 *
 * For remote deployments, the /editor/** paths are served by a Firebase
 * Cloud Function ("host").  On some deployments the function lacks
 * public-invoke permission, so hitting the URL directly returns 403.
 * To work around this we:
 *   1. Load the SPA from the home page (served from CDN cache / the
 *      same function at "/" which does have access).
 *   2. Client-side navigate to the editor route via pushState + popstate
 *      so React Router picks up the route without a server round-trip.
 *
 * @param {import('puppeteer').Page} page
 */
export async function gotoProject(page) {
    if (targetName === "local") {
        await page.goto(target.projectUrl, {
            waitUntil: "networkidle2",
            timeout: TIMEOUT.NAVIGATION
        });
        return;
    }

    // Remote targets: use pushState workaround for Firebase hosting
    // 1. Load the SPA shell from the home page
    await page.goto(`${target.baseUrl}/`, {
        waitUntil: "domcontentloaded",
        timeout: TIMEOUT.NAVIGATION
    });

    // 2. Wait for React to mount
    await page.waitForSelector("#root", { timeout: TIMEOUT.NAVIGATION });

    // 3. Client-side navigate to the editor route
    const editorPath = new URL(target.projectUrl).pathname;
    await page.evaluate((path) => {
        window.history.pushState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
    }, editorPath);
}

/**
 * Wait for the CodeMirror 6 editor to mount.
 * Fails early if the page redirects to /404 (project not found).
 * @param {import('puppeteer').Page} page
 * @param {number} [timeout=TIMEOUT.EDITOR] - Max wait in ms.
 */
export async function waitForEditor(page, timeout = TIMEOUT.EDITOR) {
    await Promise.race([
        page.waitForSelector(".cm-editor", { timeout }),
        page
            .waitForFunction(
                () =>
                    window.location.pathname === "/404" ||
                    document.body?.textContent?.includes("not found"),
                { timeout }
            )
            .then(() => {
                throw new Error(
                    `Project page redirected to 404 (URL: ${page.url()})`
                );
            })
    ]);
}

/**
 * Find the run/play button in the editor toolbar.
 * @param {import('puppeteer').Page} page
 * @returns {Promise<import('puppeteer').ElementHandle | null>}
 */
export async function findRunButton(page) {
    return page.$(RUN_BUTTON_SELECTOR);
}

/**
 * Click the Console/Output tab if it exists.
 * @param {import('puppeteer').Page} page
 */
export async function activateConsoleTab(page) {
    const tab = await page.$(CONSOLE_TAB_SELECTOR);
    if (tab) await tab.click();
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
        (selector) => {
            const el = document.querySelector(selector);
            return el && el.textContent.trim().length > 0;
        },
        { timeout },
        CONSOLE_OUTPUT_SELECTOR
    );
}

/**
 * Read current console output length.
 * @param {import('puppeteer').Page} page
 * @returns {Promise<number>}
 */
export async function getConsoleOutputLength(page) {
    return page.evaluate((selector) => {
        const el = document.querySelector(selector);
        return el?.textContent?.trim().length ?? 0;
    }, CONSOLE_OUTPUT_SELECTOR);
}

/**
 * Wait for console output to grow after an action.
 * @param {import('puppeteer').Page} page
 * @param {number} previousLength
 * @param {number} [timeout=TIMEOUT.CONSOLE_OUTPUT] - Max wait in ms.
 */
export async function waitForConsoleOutputGrowth(
    page,
    previousLength,
    timeout = TIMEOUT.CONSOLE_OUTPUT
) {
    await page.waitForFunction(
        (selector, minLength) => {
            const el = document.querySelector(selector);
            const currentLength = el?.textContent?.trim().length ?? 0;
            return currentLength > minLength;
        },
        { timeout },
        CONSOLE_OUTPUT_SELECTOR,
        previousLength
    );
}
