import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

for (const [theme, width, owner] of [
    ["default", 1440, false],
    ["github-light", 1440, true],
    ["default", 390, false],
    ["github-light", 320, true]
]) {
    test(
        `profile projects in ${theme}, ${width}px, owner=${owner}`,
        { skip: targetName !== "local", timeout: 60000 },
        async () => {
            const browser = await puppeteer.launch(BROWSER_SETTINGS);
            try {
                const page = await browser.newPage();
                page.setDefaultTimeout(10000);
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.setViewport({ width, height: 1000 });
                await page.evaluateOnNewDocument(
                    (value) => localStorage.setItem("theme", value),
                    theme
                );
                await page.setRequestInterception(true);
                page.on("request", (request) => {
                    const url = new URL(request.url());
                    if (
                        url.origin === new URL(target.baseUrl).origin ||
                        ["blob:", "data:"].includes(url.protocol)
                    )
                        void request.continue();
                    else void request.abort();
                });
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/profile-projects.html${owner ? "?owner" : ""}`
                );
                await page.waitForSelector("h2");
                const titles = () =>
                    page.$$eval("h2", (elements) =>
                        elements.map((el) => el.textContent)
                    );
                assert.equal((await titles()).length, owner ? 4 : 3);
                assert.equal(
                    await page.$eval("body", (el) =>
                        el.textContent.includes("private-tag")
                    ),
                    owner
                );
                const layout = await page.$$eval(
                    '[data-testid="project-title-row"]',
                    (rows) =>
                        rows.map((row) => {
                            const title = row
                                .querySelector("h2")
                                .getBoundingClientRect();
                            const date = row
                                .querySelector("button")
                                .getBoundingClientRect();
                            return {
                                right: date.left >= title.right,
                                top: Math.abs(date.top - title.top) < 12
                            };
                        })
                );
                assert.ok(
                    layout.every((row) => row.right && row.top),
                    JSON.stringify(layout)
                );
                assert.ok(
                    await page.evaluate(
                        () => document.documentElement.scrollWidth <= innerWidth
                    )
                );
                await mkdir("screenshots", { recursive: true });
                await page.screenshot({
                    path: `screenshots/profile-projects-${theme}-${width}.png`,
                    fullPage: true
                });
                await page
                    .locator('button[aria-label="Filter by tag ambient"]')
                    .click();
                assert.deepEqual(await titles(), [
                    "Étude for prepared piano and electronics",
                    "Glass bells"
                ]);
                await page.locator('input[type="search"]').fill("soft tones");
                await page.waitForFunction(
                    () => document.querySelectorAll("h2").length === 1
                );
                assert.deepEqual(await titles(), ["Glass bells"]);
                await page.locator('input[type="search"]').fill("no match");
                await page.waitForFunction(() =>
                    document.body.textContent.includes("No matching projects")
                );
                await page.locator("::-p-text(Clear filters)").click();
                await page.waitForFunction(
                    (count) => document.querySelectorAll("h2").length === count,
                    {},
                    owner ? 4 : 3
                );
                assert.deepEqual(errors, []);
            } finally {
                await browser.close();
            }
        }
    );
}

for (const [theme, width] of [
    ["default", 1440],
    ["github-light", 320]
]) {
    test(
        `compact card tags in ${theme}, ${width}px`,
        { skip: targetName !== "local", timeout: 60000 },
        async () => {
            const browser = await puppeteer.launch(BROWSER_SETTINGS);
            try {
                const page = await browser.newPage();
                page.setDefaultTimeout(10000);
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.setViewport({ width, height: 1100 });
                await page.evaluateOnNewDocument(
                    (value) => localStorage.setItem("theme", value),
                    theme
                );
                await page.setRequestInterception(true);
                page.on("request", (request) => {
                    const url = new URL(request.url());
                    if (
                        url.origin === new URL(target.baseUrl).origin ||
                        ["blob:", "data:"].includes(url.protocol)
                    )
                        void request.continue();
                    else void request.abort();
                });
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/profile-projects.html?cards`
                );
                await page.waitForSelector('[data-testid="project-card-tags"]');
                const layout = await page.$$eval(
                    '[data-testid="project-card-tags"]',
                    (rows) =>
                        rows.map((row) => {
                            const rect = row.getBoundingClientRect();
                            const date = row.parentElement
                                .querySelector("button")
                                .getBoundingClientRect();
                            const description =
                                row.previousElementSibling.getBoundingClientRect();
                            return {
                                height: rect.height,
                                right: Math.abs(rect.right - date.right) < 1,
                                below: rect.top >= date.bottom,
                                inline:
                                    Math.abs(rect.top - description.top) < 1,
                                separate: rect.left >= description.right
                            };
                        })
                );
                assert.equal(layout.length, 2);
                assert.ok(
                    layout.every(
                        (row) =>
                            row.height === 18 &&
                            row.right &&
                            row.below &&
                            row.inline &&
                            row.separate
                    ),
                    JSON.stringify(layout)
                );
                assert.equal(
                    await page.$('[data-testid="project-card-tags"] button'),
                    null
                );
                assert.ok(
                    await page.evaluate(
                        () => document.documentElement.scrollWidth <= innerWidth
                    )
                );
                await mkdir("screenshots", { recursive: true });
                await page.screenshot({
                    path: `screenshots/project-card-tags-${theme}-${width}.png`,
                    fullPage: true
                });
                await page.hover('[aria-label="30 more tags"]');
                await page.waitForSelector('[role="tooltip"]');
                assert.match(
                    await page.$eval(
                        '[role="tooltip"]',
                        (el) => el.textContent
                    ),
                    /tag-1, tag-2/
                );
                assert.match(
                    await page.$eval(
                        '[role="tooltip"]',
                        (el) => el.textContent
                    ),
                    /tag-30/
                );
                await page.mouse.move(0, 0);
                await page.focus('[aria-label="30 more tags"]');
                await page.waitForSelector('[role="tooltip"]');
                assert.deepEqual(errors, []);
            } finally {
                await browser.close();
            }
        }
    );
}
