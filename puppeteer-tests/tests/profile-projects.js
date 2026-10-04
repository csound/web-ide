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
                await page.locator('input[role="combobox"]').fill("ambient");
                await page.waitForSelector('[role="option"]');
                await page.click('[role="option"]');
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
