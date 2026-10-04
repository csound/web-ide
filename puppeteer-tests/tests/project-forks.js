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

for (const [theme, width] of [
    ["default", 1440],
    ["github-light", 1440],
    ["default", 390]
]) {
    test(
        `fork dialog and attribution (${theme}, ${width}px)`,
        { skip: targetName !== "local", timeout: 120000 },
        async () => {
            const browser = await puppeteer.launch(BROWSER_SETTINGS);
            try {
                const page = await browser.newPage();
                page.setDefaultTimeout(10000);
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.setViewport({ width, height: 900 });
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
                    `${target.baseUrl}/puppeteer-tests/fixtures/project-forks.html`
                );
                await page.waitForSelector('a[href="/editor/source-fixture"]');
                await page.waitForSelector(".cm-editor");
                const contrast = await page.evaluate(() => {
                    const light = (color) => {
                        const [r, g, b] = color
                            .match(/[\d.]+/g)
                            .slice(0, 3)
                            .map((value) => {
                                const channel = Number(value) / 255;
                                return channel <= 0.04045
                                    ? channel / 12.92
                                    : ((channel + 0.055) / 1.055) ** 2.4;
                            });
                        return r * 0.2126 + g * 0.7152 + b * 0.0722;
                    };
                    const text = light(
                        getComputedStyle(
                            document.querySelector(
                                'a[href="/editor/source-fixture"]'
                            )
                        ).color
                    );
                    const background = light(
                        getComputedStyle(
                            document.querySelector(".MuiAppBar-root")
                        ).backgroundColor
                    );
                    return (
                        (Math.max(text, background) + 0.05) /
                        (Math.min(text, background) + 0.05)
                    );
                });
                assert.ok(contrast >= 4.5, `Attribution contrast: ${contrast}`);
                assert.equal(
                    await page.evaluate(
                        () => document.documentElement.scrollWidth > innerWidth
                    ),
                    false
                );
                await mkdir("screenshots", { recursive: true });
                await page.screenshot({
                    path: `screenshots/fork-editor-${theme}-${width}.png`
                });
                await page.evaluate(() => window.forkFixture.hide());
                await page.waitForFunction(
                    () =>
                        !document.querySelector(
                            'a[href="/editor/source-fixture"]'
                        )
                );
                assert.equal(
                    await page.$('a[href="/editor/source-fixture"]'),
                    null
                );
                if (width < 900) {
                    await page
                        .locator('button[aria-label="Open editor menu"]')
                        .click();
                    await page.locator('button[aria-label="Project"]').click();
                    await page.locator("::-p-text(Fork Project)").click();
                } else
                    await page
                        .locator('button[aria-label="Fork project"]')
                        .click();
                await page.waitForSelector('[role="dialog"]');
                await page.waitForFunction(
                    () =>
                        getComputedStyle(
                            document.querySelector("#modal-window")
                        ).opacity === "1"
                );
                assert.equal(
                    await page.evaluate(
                        () =>
                            document
                                .querySelector('[role="dialog"]')
                                .getBoundingClientRect().right > innerWidth
                    ),
                    false
                );
                await page.screenshot({
                    path: `screenshots/fork-dialog-${theme}-${width}.png`
                });
                await page
                    .locator("::-p-aria(Project name)")
                    .fill("Slow tides");
                await page.locator("::-p-aria(Description)").click();
                await page.$eval("textarea:not([aria-hidden])", (input) =>
                    input.select()
                );
                await page.keyboard.type("A slower field recording study.");
                await page.locator("::-p-aria(Private project)").click();
                await page
                    .locator('button[aria-label="Choose project icon"]')
                    .click();
                await page
                    .waitForSelector('button[aria-label^="Select "]')
                    .catch(async (error) => {
                        await page.screenshot({
                            path: `screenshots/fork-icon-error-${theme}-${width}.png`
                        });
                        throw new Error(
                            `${error.message}; browser errors: ${JSON.stringify(errors)}; icon expanded: ${await page.$eval('button[aria-label="Choose project icon"]', (button) => button.getAttribute("aria-expanded"))}`
                        );
                    });
                await page.locator('button[aria-label^="Select "]').click();
                await page.waitForSelector('button[aria-label^="Select "]', {
                    hidden: true
                });
                await page.$eval('input[type="color"]', (input) => {
                    Object.getOwnPropertyDescriptor(
                        HTMLInputElement.prototype,
                        "value"
                    ).set.call(input, "#ffcc66");
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                });
                await page.evaluate(() => {
                    window.forkFixture.fail = true;
                });
                await page.locator('button[aria-label="Create fork"]').click();
                await page.waitForSelector('[role="alert"]');
                assert.match(
                    await page.$eval(
                        '[role="alert"]',
                        (element) => element.textContent
                    ),
                    /hidden/
                );
                await page.evaluate(() => {
                    window.forkFixture.fail = false;
                });
                await page.locator('button[aria-label="Create fork"]').click();
                await page.waitForFunction(
                    () => window.forkDestination === "/editor/new-fork"
                );
                const requests = await page.evaluate(
                    () => window.forkFixture.requests
                );
                assert.equal(requests.length, 2);
                assert.equal(requests[1].name, "Slow tides");
                assert.equal(requests[1].public, true);
                assert.equal(
                    requests[1].description,
                    "A slower field recording study."
                );
                assert.equal(requests[1].iconForegroundColor, "#ffcc66");
                assert.equal(requests[1].iconName, "fadADR");
                assert.equal(requests[1].sourceProjectUid, "fork-fixture");
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/project-forks.html?cards`
                );
                await page.waitForSelector('a[href="/editor/source-fixture"]');
                assert.equal(
                    (await page.$$('a[href="/editor/source-fixture"]')).length,
                    2
                );
                assert.equal(
                    (await page.$$('button[aria-label$="Show project dates"]'))
                        .length,
                    2
                );
                assert.equal((await page.$$("a a, a button")).length, 0);
                assert.equal(
                    await page.evaluate(
                        () => document.documentElement.scrollWidth > innerWidth
                    ),
                    false
                );
                await page.screenshot({
                    path: `screenshots/fork-project-lists-${theme}-${width}.png`
                });
                await page
                    .locator('button[aria-label$="Show project dates"]')
                    .click();
                await page.waitForSelector('[role="tooltip"]');
                await page.evaluate(() => window.forkFixture.hide());
                await page.waitForFunction(
                    () =>
                        document.querySelectorAll(
                            'a[href="/editor/source-fixture"]'
                        ).length === 0
                );
                assert.deepEqual(errors, []);
            } finally {
                await browser.close();
            }
        }
    );
}
