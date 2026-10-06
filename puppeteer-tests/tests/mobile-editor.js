import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

const mocks = {
    "/src/components/projects/fork-api.ts": `
        const listeners = new Set();
        window.forkFixture = {
            fail: false, requests: [],
            hide: () => listeners.forEach(callback => callback({id:"source-fixture",status:"hidden"}))
        };
        export const subscribeToForkSource = (id, callback) => {
            callback({id, status:"public", name:"Tidal grains"});
            listeners.add(callback);
            return () => listeners.delete(callback);
        };
        export const createProjectFork = async details => {
            window.forkFixture.requests.push(details);
            await new Promise(resolve => setTimeout(resolve, 200));
            if (window.forkFixture.fail) throw new Error("This project is hidden or no longer exists.");
            return "new-fork";
        };
    `,
    "/src/components/router/navigate.ts":
        "export const navigateTo = path => { window.forkDestination = path; };",
    "/src/components/projects/subscribers.tsx": [
        "subscribeToProjectChanges",
        "subscribeToProjectFilesChanges",
        "subscribeToProjectTargetsChanges"
    ]
        .map((name) => `export const ${name} = () => () => {};`)
        .join("\n"),
    "/src/components/project-last-modified/subscribers.tsx":
        "export const subscribeToProjectLastModified = async () => () => {};",
    "/src/components/social-controls/subscribers.tsx":
        "export const subscribeToProjectStars = () => () => {};",
    "/src/components/profile/subscribers.tsx": [
        "subscribeToProfile",
        "subscribeToFollowing",
        "subscribeToFollowers",
        "subscribeToProjectsCount",
        "subscribeToProfileStars",
        "subscribeToProfileProjects"
    ]
        .map((name) => `export const ${name} = () => () => {};`)
        .join("\n")
};

for (const [theme, width, height, variant = ""] of [
    ["default", 320, 640],
    ["default", 320, 640, "?guest"],
    ["default", 390, 844, "?playlist"],
    ["default", 390, 844, "?playlist&empty"],
    ["default", 390, 844],
    ["github-light", 390, 844],
    ["default", 768, 1024],
    ["default", 844, 390],
    ["github-light", 1440, 900]
]) {
    test(
        `mobile workspace (${theme}, ${width}x${height}${variant})`,
        { skip: targetName !== "local", timeout: 120000 },
        async () => {
            const browser = await puppeteer.launch(BROWSER_SETTINGS);
            try {
                const page = await browser.newPage();
                page.setDefaultTimeout(10000);
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.setViewport({
                    width,
                    height,
                    hasTouch: width < 900
                });
                await page.evaluateOnNewDocument(
                    (value) => localStorage.setItem("theme", value),
                    theme
                );
                await page.setRequestInterception(true);
                page.on("request", (request) => {
                    const url = new URL(request.url());
                    if (mocks[url.pathname])
                        void request.respond({
                            status: 200,
                            contentType: "application/javascript",
                            body: mocks[url.pathname]
                        });
                    else if (
                        url.origin === new URL(target.baseUrl).origin ||
                        ["blob:", "data:"].includes(url.protocol)
                    )
                        void request.continue();
                    else void request.abort();
                });
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/mobile-editor.html${variant}`
                );
                await page.waitForSelector(".cm-editor");
                await mkdir("screenshots", { recursive: true });
                const screenshot = (name) =>
                    page.screenshot({
                        path: `screenshots/mobile-${theme}-${width}${variant.replace("?", "-")}-${name}.png`
                    });
                const noOverflow = async () =>
                    assert.equal(
                        await page.evaluate(
                            () =>
                                document.documentElement.scrollWidth >
                                innerWidth
                        ),
                        false
                    );
                await noOverflow();
                assert.equal(
                    await page.evaluate(() =>
                        [...document.querySelectorAll("header button")].every(
                            (button) =>
                                button.getBoundingClientRect().right <=
                                innerWidth
                        )
                    ),
                    true
                );
                if (width > 900) {
                    assert.equal(
                        await page.$('nav[aria-label="Editor views"]'),
                        null
                    );
                    assert.match(
                        await page.$eval(
                            "body",
                            (element) => element.textContent
                        ),
                        /WebMCP/
                    );
                    await screenshot("desktop");
                    return;
                }
                const nav = 'nav[aria-label="Editor views"]';
                assert.equal(
                    await page.$eval(
                        nav,
                        (element) => element.querySelectorAll("button").length
                    ),
                    6
                );
                assert.doesNotMatch(
                    await page.$eval("body", (element) => element.textContent),
                    /WebMCP/
                );
                // The last paragraph must be reachable above the navigation.
                assert.equal(
                    await page.evaluate(() => {
                        const last = [
                            ...document.querySelectorAll("p")
                        ].findLast(
                            (element) =>
                                element.textContent === "Notes on a grain."
                        );
                        last.parentElement.scrollTop =
                            last.parentElement.scrollHeight;
                        return (
                            last.getBoundingClientRect().bottom <=
                            document
                                .querySelector('nav[aria-label="Editor views"]')
                                .getBoundingClientRect().top
                        );
                    }),
                    true
                );
                await page
                    .locator('button[aria-label="Edit Markdown"]')
                    .click();
                await page.waitForSelector(".cm-editor", { visible: true });
                await page
                    .locator('button[aria-label="Preview Markdown"]')
                    .click();
                await screenshot("editor");
                await page.locator(`${nav} button[aria-label="Files"]`).click();
                await page.waitForSelector('[data-testid="file-tree"]');
                await page
                    .locator(
                        '[data-testid="file-tree"] p ::-p-text(project.csd)'
                    )
                    .click();
                await page.waitForSelector(".cm-editor", { visible: true });
                assert.equal(
                    await page.$eval(
                        `${nav} button[aria-label="Edit"]`,
                        (button) => button.getAttribute("aria-current")
                    ),
                    "page"
                );
                // Selecting the same file again must also return to the editor.
                await page.locator(`${nav} button[aria-label="Files"]`).click();
                await page
                    .locator(
                        '[data-testid="file-tree"] p ::-p-text(project.csd)'
                    )
                    .click();
                await page.waitForSelector(".cm-editor", { visible: true });
                await page.$eval(".cm-scroller", (element) => {
                    element.scrollTop = element.scrollHeight;
                });
                await page.waitForFunction(() =>
                    [...document.querySelectorAll(".cm-line")].some(
                        (element) => element.textContent === "; Line 100"
                    )
                );
                assert.equal(
                    await page.evaluate(() => {
                        const last = [
                            ...document.querySelectorAll(".cm-line")
                        ].find(
                            (element) => element.textContent === "; Line 100"
                        );
                        return (
                            last.getBoundingClientRect().bottom <=
                            document
                                .querySelector('nav[aria-label="Editor views"]')
                                .getBoundingClientRect().top
                        );
                    }),
                    true
                );
                await screenshot("code");
                await page
                    .locator(`${nav} button[aria-label="Console"]`)
                    .click();
                await page.waitForSelector(
                    '[data-testid="console-output-container"]'
                );
                // Check the layout with less space, as when a software keyboard opens.
                await page.setViewport({ width, height: 320, hasTouch: true });
                assert.equal(
                    await page.evaluate(() => {
                        const output = document
                            .querySelector(
                                '[data-testid="console-output-container"]'
                            )
                            .getBoundingClientRect();
                        const footer = document
                            .querySelector('nav[aria-label="Editor views"]')
                            .getBoundingClientRect();
                        return (
                            output.height > 0 &&
                            output.bottom <= footer.top + 1 &&
                            footer.bottom <= innerHeight
                        );
                    }),
                    true
                );
                await page.setViewport({ width, height, hasTouch: true });
                await page
                    .locator(`${nav} button[aria-label="Manual"]`)
                    .click();
                await page.waitForSelector(
                    'iframe[title="Csound reference manual"]'
                );
                assert.equal(
                    await page.evaluate(
                        () =>
                            document
                                .querySelector(
                                    'iframe[title="Csound reference manual"]'
                                )
                                .getBoundingClientRect().bottom <=
                            document
                                .querySelector('nav[aria-label="Editor views"]')
                                .getBoundingClientRect().top +
                                1
                    ),
                    true
                );
                await page
                    .locator(`${nav} button[aria-label="Console"]`)
                    .click();
                await page
                    .locator('button[aria-label="Open editor menu"]')
                    .click();
                await page.waitForSelector('[role="dialog"]');
                await screenshot("menu");
                assert.equal(
                    await page.evaluate(() => {
                        const dialog = document
                            .querySelector('[role="dialog"]')
                            .getBoundingClientRect();
                        return (
                            dialog.left >= 0 &&
                            dialog.right <= innerWidth &&
                            dialog.top >= 0 &&
                            dialog.bottom <= innerHeight
                        );
                    }),
                    true
                );
                assert.equal(
                    await page.$eval(
                        "main",
                        (element) => getComputedStyle(element).paddingLeft
                    ),
                    "0px"
                );
                for (const name of [
                    "File",
                    "Edit",
                    "Project",
                    "View",
                    "I/O",
                    "Help"
                ]) {
                    assert.equal(
                        await page.$eval(
                            `[role="dialog"] button[aria-label="${name}"]`,
                            (element) => {
                                const rect = element.getBoundingClientRect();
                                return (
                                    rect.width >= 44 &&
                                    rect.height >= 44 &&
                                    rect.left >= 0 &&
                                    rect.right <= innerWidth
                                );
                            }
                        ),
                        true
                    );
                }
                await page
                    .locator('[role="dialog"] button[aria-label="Edit"]')
                    .click();
                assert.equal(
                    await page.$eval(
                        "#mobile-top-menu button:disabled",
                        (element) => element.textContent.trim()
                    ),
                    "Eval Selection / Form"
                );
                // Reach Theme through Tab, skipping disabled evaluation actions.
                for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
                assert.equal(
                    await page.evaluate(() =>
                        document.activeElement.textContent.trim()
                    ),
                    "Theme"
                );
                await page.keyboard.press("Enter");
                assert.equal(
                    await page.evaluate(() =>
                        document.activeElement.textContent.trim()
                    ),
                    "Default"
                );
                await page.keyboard.down("Shift");
                await page.keyboard.press("Tab");
                await page.keyboard.up("Shift");
                assert.equal(
                    await page.evaluate(() =>
                        document.activeElement.getAttribute("aria-label")
                    ),
                    "Go back"
                );
                await page.keyboard.press("Enter");
                assert.equal(
                    await page.evaluate(() =>
                        document.activeElement.textContent.trim()
                    ),
                    "Theme"
                );
                await page.keyboard.press("Enter");
                await page.locator("::-p-text(Dracula)").click();
                await page.waitForSelector('[role="dialog"]', { hidden: true });
                assert.equal(
                    await page.evaluate(() => localStorage.getItem("theme")),
                    "dracula"
                );
                await page
                    .locator('button[aria-label="Open editor menu"]')
                    .click();
                for (let i = 0; i < 20; i++) {
                    await page.keyboard.press("Tab");
                    assert.equal(
                        await page.evaluate(
                            () =>
                                !!document.activeElement.closest(
                                    '[role="dialog"]'
                                )
                        ),
                        true
                    );
                }
                await page.keyboard.press("Escape");
                await page.waitForSelector('[role="dialog"]', { hidden: true });
                assert.equal(
                    await page.evaluate(() =>
                        document.activeElement.getAttribute("aria-label")
                    ),
                    "Open editor menu"
                );
                if (variant.includes("empty")) {
                    await page
                        .locator(
                            '[role="combobox"][aria-label="Start playlist from"]'
                        )
                        .click();
                    await page
                        .locator('[role="option"][data-value="configure"]')
                        .click();
                    await page.waitForSelector('[role="listbox"]', {
                        hidden: true
                    });
                    await page.waitForFunction(
                        () =>
                            getComputedStyle(
                                document.querySelector("#modal-window")
                            ).opacity === "1"
                    );
                    await page.waitForSelector(
                        'button[aria-label="Close playback settings"]'
                    );
                    await page
                        .locator('button[aria-label="Close playback settings"]')
                        .click();
                    await page.waitForSelector('[role="dialog"]', {
                        hidden: true
                    });
                }
                await noOverflow();
                assert.deepEqual(errors, []);
            } finally {
                await browser.close();
            }
        }
    );
}
