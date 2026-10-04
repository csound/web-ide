import assert from "node:assert/strict";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

for (const theme of ["default", "github-light"])
    test(
        `100 project files remain scrollable and the last file can be selected as a target (${theme})`,
        { skip: targetName !== "local", timeout: 60000 },
        async () => {
            const browser = await puppeteer.launch(BROWSER_SETTINGS);
            try {
                const page = await browser.newPage();
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.evaluateOnNewDocument(
                    (value) => localStorage.setItem("theme", value),
                    theme
                );
                await page.setViewport({ width: 1280, height: 900 });
                await page.setRequestInterception(true);
                page.on("request", (request) => {
                    const url = new URL(request.url());
                    if (
                        url.origin === new URL(target.baseUrl).origin ||
                        ["data:", "blob:"].includes(url.protocol)
                    )
                        void request.continue();
                    else void request.abort();
                });
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/project-file-list.html`
                );
                await page.waitForSelector(
                    '[data-testid="file-tree-item-example-100.csd"]'
                );
                assert.equal(
                    (await page.$$('[data-testid^="file-tree-item-"]')).length,
                    100
                );
                const scroll = await page.$eval(
                    '[data-testid="file-tree"]',
                    (tree) => {
                        tree.scrollTop = tree.scrollHeight;
                        const last = tree
                            .querySelector(
                                '[data-testid="file-tree-item-example-100.csd"]'
                            )
                            .getBoundingClientRect();
                        const viewport = tree.getBoundingClientRect();
                        return {
                            overflow: getComputedStyle(tree).overflowY,
                            moved: tree.scrollTop > 0,
                            lastVisible:
                                last.top >= viewport.top &&
                                last.bottom <= viewport.bottom + 1
                        };
                    }
                );
                assert.deepEqual(scroll, {
                    overflow: "auto",
                    moved: true,
                    lastVisible: true
                });
                await page.focus('[role="combobox"]');
                await page.keyboard.press("ArrowDown");
                await page.waitForSelector('[role="listbox"]');
                assert.equal((await page.$$('[role="option"]')).length, 100);
                const menu = await page.$eval('[role="listbox"]', (list) => ({
                    height: list.clientHeight,
                    overflow: getComputedStyle(list).overflowY
                }));
                assert.ok(
                    menu.height <= 300 && menu.overflow === "auto",
                    JSON.stringify(menu)
                );
                const option = await page.$('[role="option"]:last-child');
                await option.scrollIntoView();
                await option.click();
                assert.equal(
                    await page.$eval(
                        '[data-testid="selected-target"]',
                        (element) => element.textContent
                    ),
                    "example-100.csd"
                );
                assert.deepEqual(errors, []);
            } finally {
                await browser.close();
            }
        }
    );
