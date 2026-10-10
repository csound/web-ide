import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

test(
    "Escape closes focused plots in focus order without a title outline",
    { skip: targetName !== "local", timeout: 60000 },
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const page = await browser.newPage();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            await page.setViewport({ width: 1440, height: 900 });
            await page.goto(
                `${target.baseUrl}/puppeteer-tests/fixtures/ftgen.html?multiple`
            );
            await page.waitForFunction(() => window.ftgenFixture?.text());
            if (!(await page.evaluate(() => window.ftgenFixture.available)))
                return;
            const first = '[aria-label="Function table gi_tales_trisaw"]';
            const second = '[aria-label="Function table gi_second"]';
            const third = '[aria-label="Function table gi_third"]';
            const open = async (name, selector) => {
                await page.evaluate(
                    (name) => window.ftgenFixture.focus(name),
                    name
                );
                await page.keyboard.down("Alt");
                await page.keyboard.press("Enter");
                await page.keyboard.up("Alt");
                await page.waitForSelector(selector);
                assert.equal(
                    await page.$eval(
                        selector,
                        (node) => document.activeElement === node
                    ),
                    true,
                    "opening a plot focuses the dialog, not the title"
                );
            };
            await open("fixture", first);
            assert.equal(
                await page.$eval(`${first} header span[tabindex]`, (node) => {
                    node.focus();
                    return getComputedStyle(node).outlineStyle;
                }),
                "none"
            );
            // Leave part of the first window exposed behind the other two.
            const title = await page.$eval(`${first} header`, (node) => {
                const rect = node.getBoundingClientRect();
                return { x: rect.x + 100, y: rect.y + 20 };
            });
            await page.mouse.move(title.x, title.y);
            await page.mouse.down();
            await page.mouse.move(108, title.y, { steps: 4 });
            await page.mouse.up();
            await open("second", second);
            await open("third", third);

            await page.evaluate(() => window.ftgenFixture.focus());
            await page.keyboard.press("Escape");
            assert.equal((await page.$$('[role="dialog"]')).length, 3);

            // Clicking the title background must focus and raise that window.
            await page.mouse.click(32, title.y);
            assert.equal(
                await page.$eval(
                    first,
                    (node) => document.activeElement === node
                ),
                true
            );
            assert.ok(
                (await page.$eval(first, (node) => Number(node.style.zIndex))) >
                    (await page.$eval(third, (node) =>
                        Number(node.style.zIndex)
                    ))
            );
            await page.keyboard.down("Escape");
            await page.waitForSelector(first, { hidden: true });
            assert.equal(
                await page.$eval(
                    third,
                    (node) => document.activeElement === node
                ),
                true
            );
            await page.keyboard.down("Escape");
            assert.equal(
                (await page.$$('[role="dialog"]')).length,
                2,
                "holding Escape must not close the next window"
            );
            await page.keyboard.up("Escape");
            await page.keyboard.press("Escape");
            await page.waitForSelector(third, { hidden: true });
            assert.equal(
                await page.$eval(
                    second,
                    (node) => document.activeElement === node
                ),
                true
            );
            await page.keyboard.press("Escape");
            await page.waitForSelector('[role="dialog"]', { hidden: true });
            assert.equal(
                await page.evaluate(() =>
                    document.activeElement?.classList.contains("cm-content")
                ),
                true
            );

            await open("fixture", first);
            await open("second", second);
            await page.click(`${second} [aria-label="Minimize table plot"]`);
            await page.keyboard.press("Escape");
            await page.waitForSelector(second, { hidden: true });
            assert.equal(
                await page.$eval(
                    first,
                    (node) => document.activeElement === node
                ),
                true
            );
            await page.click(`${first} [aria-label="Close table plot"]`);
            await page.waitForSelector('[role="dialog"]', { hidden: true });
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);

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

test(
    "table inspection follows sample edits and resizing",
    { skip: targetName !== "local", timeout: 60000 },
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const page = await browser.newPage();
            await page.goto(
                `${target.baseUrl}/puppeteer-tests/fixtures/ftgen.html`
            );
            await page.waitForFunction(() => window.ftgenFixture?.text());
            if (!(await page.evaluate(() => window.ftgenFixture.available)))
                return;
            await page.evaluate(() =>
                window.ftgenFixture.replace(
                    "0,0,1024,7,1,5,-0.6,246,0.3,5,-0.3,251,0.6,5,-1,512,1",
                    "0,0,8,-7,0,8,1"
                )
            );
            await page.click(".cm-ftgen-link");
            const graph = '[role="dialog"] svg[role="img"]';
            const readout = '[role="dialog"] output';
            await page.waitForSelector(graph);
            assert.equal(
                await page.$eval(readout, (node) => node.value),
                "Point to the curve to inspect"
            );
            await page.$eval(graph, (svg) => svg.focus());
            await page.keyboard.press("ArrowRight");
            assert.match(
                await page.$eval(readout, (node) => node.value),
                /^Sample 1\s+0\.125$/
            );
            await page.evaluate(() =>
                window.ftgenFixture.replace("8,-7,0,8,1", "8,-7,0,8,2")
            );
            await page.waitForFunction(() =>
                /^Sample 1\s+0\.25$/.test(
                    document.querySelector('[role="dialog"] output')?.value
                )
            );
            await page.$eval(graph, (svg) => svg.focus());
            await page.keyboard.press("End");
            await page.evaluate(() =>
                window.ftgenFixture.replace("8,-7,0,8,2", "4,-7,1,4,3")
            );
            await page.waitForFunction(() =>
                /^Guard point\s+1$/.test(
                    document.querySelector('[role="dialog"] output')?.value
                )
            );
            const width = await page.$eval(
                graph,
                (svg) => svg.viewBox.baseVal.width
            );
            await page.focus('[aria-label="Resize table plot"]');
            await page.keyboard.press("ArrowLeft");
            await page.waitForFunction(
                (previousWidth) => {
                    const svg = document.querySelector(
                        '[role="dialog"] svg[role="img"]'
                    );
                    const cursor = svg.querySelector(
                        'g[pointer-events="none"]'
                    );
                    const x = cursor.transform.baseVal.consolidate().matrix.e;
                    return (
                        svg.viewBox.baseVal.width < previousWidth &&
                        Math.abs(x - (svg.viewBox.baseVal.width - 20)) < 0.01
                    );
                },
                {},
                width
            );
            // Keyboard inspection must resume at the clamped index, too.
            await page.$eval(graph, (svg) => svg.focus());
            await page.keyboard.press("ArrowLeft");
            assert.match(
                await page.$eval(readout, (node) => node.value),
                /^Sample 3\s+2\.5$/
            );
        } finally {
            await browser.close();
        }
    }
);
