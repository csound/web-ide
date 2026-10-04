import assert from "node:assert/strict";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

for (const theme of ["default", "github-light"]) {
    test(
        `file icons align across types, nesting, and row heights (${theme})`,
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
                await page.setRequestInterception(true);
                page.on("request", (request) => {
                    if (
                        new URL(request.url()).origin ===
                            new URL(target.baseUrl).origin ||
                        request.url().startsWith("data:")
                    )
                        void request.continue();
                    else void request.abort();
                });
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/file-type-icons.html`,
                    { waitUntil: "networkidle0" }
                );
                await page.waitForSelector('[data-testid="file-tree"]');
                await page.click("li.folder-samples");
                await page.waitForSelector(
                    ".MuiCollapse-entered li.folder-nested",
                    {
                        visible: true
                    }
                );
                await page.click("li.folder-nested");
                await page.waitForSelector(
                    '[data-testid="file-tree-item-deep.orc"]',
                    { visible: true }
                );
                // Wait for the folder expansion to finish before measuring rows.
                await page.waitForFunction(() =>
                    [...document.querySelectorAll(".MuiCollapse-root")].every(
                        (node) => node.classList.contains("MuiCollapse-entered")
                    )
                );
                for (const width of [520, 320]) {
                    await page.setViewport({ width, height: 1500 });
                    const layout = await page.evaluate(() => {
                        const rows = [
                            ...document.querySelectorAll(
                                '[data-testid="file-tree"] li'
                            )
                        ].map((row) => {
                            const rect = row.getBoundingClientRect();
                            const icon = row
                                .querySelector(".MuiListItemIcon-root > svg")
                                .getBoundingClientRect();
                            const text = row.querySelector("p");
                            const label = text.getBoundingClientRect();
                            const actions =
                                row.lastElementChild.getBoundingClientRect();
                            return {
                                name: text.textContent,
                                height: rect.height,
                                iconCenter: icon.y + icon.height / 2,
                                rowCenter: rect.y + rect.height / 2,
                                labelCenter: label.y + label.height / 2,
                                x: icon.x + icon.width / 2,
                                labelX: label.x,
                                labelRight: label.right,
                                actionsLeft: actions.x
                            };
                        });
                        const tree = document.querySelector(
                            '[data-testid="file-tree"]'
                        );
                        return {
                            rows,
                            overflow: tree.scrollWidth > tree.clientWidth
                        };
                    });
                    assert.equal(
                        layout.overflow,
                        false,
                        `no horizontal overflow at ${width}`
                    );
                    const root = layout.rows.find(
                        (row) => row.name === "project.csd"
                    );
                    assert.ok(root);
                    for (const row of layout.rows) {
                        assert.ok(
                            Math.abs(row.iconCenter - row.rowCenter) < 1,
                            `${row.name}: icon centered vertically at ${width}`
                        );
                        assert.ok(
                            Math.abs(row.labelCenter - row.rowCenter) < 1,
                            `${row.name}: label centered vertically`
                        );
                        const depth =
                            row.name === "deep.orc"
                                ? 2
                                : ["nested", "nested.wav"].includes(row.name)
                                  ? 1
                                  : 0;
                        assert.equal(
                            row.x - root.x,
                            depth * 24,
                            `${row.name}: icon indentation`
                        );
                        assert.equal(
                            row.labelX - root.labelX,
                            depth * 24,
                            `${row.name}: label indentation`
                        );
                        assert.ok(
                            row.labelRight <= row.actionsLeft,
                            `${row.name}: actions stay clear of text`
                        );
                    }
                    assert.equal(
                        layout.rows.find((row) => row.name === "rendered.wav")
                            .height,
                        42
                    );
                    assert.equal(root.height, 36);
                }
                await page.click("li.folder-samples");
                await page.waitForSelector(
                    '[data-testid="file-tree-item-deep.orc"]',
                    { hidden: true }
                );
                assert.ok(
                    await page.$(
                        'li.folder-samples [data-testid="FolderOutlinedIcon"]'
                    )
                );
                assert.deepEqual(errors, []);
            } finally {
                await browser.close();
            }
        }
    );
}
