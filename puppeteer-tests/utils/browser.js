import fs from "node:fs";
import path from "node:path";
import { target, targetName, TIMEOUT } from "./config.js";

const RUN_BUTTON_SELECTOR = '[data-testid="run-button"]';
const CONSOLE_OUTPUT_SELECTOR = '[data-testid="console-output"]';
const FILE_TREE_SELECTOR = '[data-testid="file-tree"]';
const CONSOLE_SIDEBAR_SELECTOR = '[data-testid="sidebar-bottom-console"]';

const SCREENSHOTS_DIR = path.join(import.meta.dirname, "..", "screenshots");

/**
 * Attach console and error listeners to a page for CI debugging.
 * Collected messages are stored on the page object for later retrieval.
 * @param {import('puppeteer').Page} page
 */
export function attachPageDebugListeners(page) {
    /** @type {string[]} */
    const logs = [];
    page.__debugLogs = logs;

    page.on("console", (msg) => {
        logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
        logs.push(`[PAGE ERROR] ${err.message}`);
    });
    page.on("requestfailed", (req) => {
        logs.push(`[REQ FAIL] ${req.url()} ${req.failure()?.errorText}`);
    });
}

/**
 * Save a screenshot and dump collected browser logs.
 * @param {import('puppeteer').Page} page
 * @param {string} name - Base filename (without extension).
 */
export async function dumpDebugInfo(page, name) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

    try {
        const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved: ${screenshotPath}`);
    } catch (e) {
        console.error("Failed to save screenshot:", e.message);
    }

    const logs = page.__debugLogs ?? [];
    if (logs.length > 0) {
        console.log(`--- Browser logs (${name}) ---`);
        for (const line of logs.slice(-50)) console.log(line);
        console.log("--- end browser logs ---");
    }

    try {
        const html = await page.content();
        const htmlPath = path.join(SCREENSHOTS_DIR, `${name}.html`);
        fs.writeFileSync(htmlPath, html);
        console.log(`Page HTML saved: ${htmlPath}`);
    } catch (e) {
        console.error("Failed to save HTML:", e.message);
    }
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
        // Use "domcontentloaded" instead of "networkidle2" for Vite dev
        // server.  Vite transforms modules on-demand, so network activity
        // can fluctuate long after the HTML is parsed.  The actual
        // readiness check (project load) is handled by waitForProject().
        await page.goto(target.projectUrl, {
            waitUntil: "domcontentloaded",
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
 * Wait for the project to load and the file tree to appear.
 * Fails early if the page redirects to /404 (project not found).
 * @param {import('puppeteer').Page} page
 * @param {number} [timeout=TIMEOUT.EDITOR] - Max wait in ms.
 */
export async function waitForProject(page, timeout = TIMEOUT.EDITOR) {
    // First, wait for the React app to produce any DOM inside #root.
    // If this times out the app's JS likely crashed during bootstrap.
    await page.waitForFunction(
        () => {
            const root = document.querySelector("#root");
            return root && root.children.length > 0;
        },
        { timeout: Math.min(timeout, 30_000) }
    );

    await Promise.race([
        page.waitForSelector(FILE_TREE_SELECTOR, { timeout }),
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
 * Click a file in the file tree by filename to open it in the editor.
 * Waits for the CodeMirror editor to mount after clicking.
 * @param {import('puppeteer').Page} page
 * @param {string} filename - Exact filename to click, e.g. "project.csd".
 * @param {number} [timeout=TIMEOUT.EDITOR] - Max wait in ms.
 */
export async function openFileFromTree(
    page,
    filename,
    timeout = TIMEOUT.EDITOR
) {
    const selector = `[data-testid="file-tree-item-${filename}"]`;
    await page.waitForSelector(selector, { timeout });
    await page.click(selector);
    await page.waitForSelector(".cm-editor", { timeout });
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
 * Open the console panel via the sidebar launcher button.
 * @param {import('puppeteer').Page} page
 */
export async function openConsolePanel(page) {
    const btn = await page.$(CONSOLE_SIDEBAR_SELECTOR);
    if (btn) {
        const isActive = await btn.evaluate(
            (el) => el.getAttribute("aria-pressed") === "true"
        );
        if (!isActive) {
            await btn.click();
        }
    }
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
