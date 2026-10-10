import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

test(
    "function table preview is optional, lazy and follows edits",
    { skip: targetName !== "local", timeout: 60000 },
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const page = await browser.newPage();
            const errors = [],
                downloads = [];
            page.on("pageerror", (error) => errors.push(error.message));
            page.on("request", (request) => {
                if (/csound-ftgen-.*\.wasm/.test(request.url()))
                    downloads.push(request.url());
            });
            await page.goto(
                `${target.baseUrl}/puppeteer-tests/fixtures/ftgen.html`
            );
            await page.waitForFunction(() => window.ftgenFixture?.text());
            assert.equal(downloads.length, 0);
            const available = await page.evaluate(
                () => window.ftgenFixture.available
            );
            if (!available) {
                assert.equal(await page.$(".cm-ftgen-link"), null);
                assert.deepEqual(errors, []);
                return;
            }
            await page.click(".cm-ftgen-link");
            await page.waitForSelector('[aria-label^="Linear segments."]');
            assert.equal(downloads.length, 1);
            const dialog = '[role="dialog"]';
            mkdirSync("screenshots", { recursive: true });
            await page.screenshot({ path: "screenshots/ftgen-dark.png" });
            await page.evaluate(() =>
                window.ftgenFixture.replace("1024,7", "2048,7")
            );
            await page.waitForFunction(() =>
                document
                    .querySelector('[role="dialog"]')
                    ?.textContent.includes("2,048 samples")
            );
            assert.equal(
                downloads.length,
                1,
                "successful edits reuse the compiled worker"
            );
            const before = await page.$eval(dialog, (node) => ({
                x: node.getBoundingClientRect().x,
                y: node.getBoundingClientRect().y
            }));
            const title = await page.$eval(`${dialog} header`, (node) => ({
                x: node.getBoundingClientRect().x + 100,
                y: node.getBoundingClientRect().y + 20
            }));
            await page.mouse.move(title.x, title.y);
            await page.mouse.down();
            await page.mouse.move(title.x + 50, title.y + 40, { steps: 4 });
            await page.mouse.up();
            const after = await page.$eval(dialog, (node) => ({
                x: node.getBoundingClientRect().x,
                y: node.getBoundingClientRect().y
            }));
            assert.ok(after.x > before.x && after.y > before.y);
            const resize = await page.$('[aria-label="Resize table plot"]');
            await resize.focus();
            await page.keyboard.press("ArrowRight");
            await page.click('[aria-label="Full screen"]');
            assert.ok(
                await page.$eval(
                    dialog,
                    (node) =>
                        node.getBoundingClientRect().width >
                        window.innerWidth - 20
                )
            );
            await page.click('[aria-label="Exit full screen"]');
            await page.click('[aria-label="Minimize table plot"]');
            assert.equal(
                await page.$('[aria-label^="Linear segments."]'),
                null
            );
            await page.click('[aria-label="Restore table plot"]');
            await page.waitForSelector('[aria-label^="Linear segments."]');
            await page.evaluate(() =>
                window.ftgenFixture.replace("gi_tales_trisaw", "gi_renamed")
            );
            await page.waitForSelector(dialog, { hidden: true });
            const links = await page.$$(".cm-ftgen-link");
            await links.at(-1).click();
            await page.waitForSelector(
                '[aria-label="Input partial amplitudes"]'
            );
            assert.match(
                await page.$eval(
                    `${dialog} header`,
                    (node) => node.textContent
                ),
                /f1 GEN10/
            );
            await page.evaluate(() =>
                window.ftgenFixture.replace("f 1 ", "f 2 ")
            );
            await page.waitForSelector(dialog, { hidden: true });
            await page.goto(
                `${target.baseUrl}/puppeteer-tests/fixtures/ftgen.html?light`
            );
            await page.waitForSelector(".cm-ftgen-link");
            await page.click(".cm-ftgen-link");
            await page.waitForSelector('[aria-label^="Linear segments."]');
            await page.screenshot({ path: "screenshots/ftgen-light.png" });
            await page.setViewport({ width: 390, height: 720 });
            await page.screenshot({ path: "screenshots/ftgen-mobile.png" });
            assert.ok(
                await page.$eval(
                    dialog,
                    (node) =>
                        node.getBoundingClientRect().right <= window.innerWidth
                )
            );
            await page.click('[aria-label="Close table plot"]');
            await page.waitForSelector(dialog, { hidden: true });
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);
