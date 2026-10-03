import assert from "node:assert/strict";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

const localOnly = { skip: targetName !== "local", timeout: 120000 };
const harness = `<!doctype html><title>Manual code test</title>
<style>body{margin:0}iframe{width:100%;height:100vh;border:0;display:block}</style>
<iframe title="Manual" src="/manual/opcodes/oscili/"></iframe>
<script>
window.opened = [];
addEventListener('message', event => {
    if (event.data.type !== 'csound-manual:open-example') return;
    window.opened.push(event.data.url);
    event.source.postMessage({type:'csound-manual:example-opened', documentId:event.data.documentId, requestId:event.data.requestId}, location.origin);
});
</script>`;

async function setup(browser, blockPreview = false) {
    const page = await browser.newPage();
    const errors = [];
    const requests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on("request", (request) => {
        const url = new URL(request.url());
        requests.push(url);
        if (url.pathname === "/manual-code-test")
            void request.respond({
                status: 200,
                contentType: "text/html",
                body: harness
            });
        else if (blockPreview && url.pathname.endsWith("/manual-code.js"))
            void request.abort();
        else void request.continue();
    });
    // Keep the OS clipboard untouched while checking the exact copied text.
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator.clipboard, "writeText", {
            value: async (source) => {
                window.copiedCode = source;
            }
        });
    });
    return { page, errors, requests };
}

test(
    "readonly Csound previews pair copy and open controls at every width and theme",
    localOnly,
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const { page, errors, requests } = await setup(browser);
            for (const theme of ["monokai", "github-light"]) {
                await page.evaluateOnNewDocument(
                    (name) => localStorage.setItem("theme", name),
                    theme
                );
                for (const width of [320, 768, 1440]) {
                    await page.setViewport({ width, height: 900 });
                    await page.goto(`${target.baseUrl}/manual-code-test`);
                    await page.waitForFunction(() =>
                        document
                            .querySelector("iframe")
                            .contentDocument.querySelector(
                                '[data-example="oscili.csd"] .cm-editor'
                            )
                    );
                    const frame = page
                        .frames()
                        .find((frame) =>
                            frame.url().includes("/opcodes/oscili/")
                        );
                    const block = '[data-example="oscili.csd"]';
                    assert.equal(
                        await frame.evaluate(
                            () => document.documentElement.dataset.theme
                        ),
                        theme === "github-light" ? "light" : "dark"
                    );
                    const layout = await frame.$eval(block, (node) => {
                        const copy = node
                            .querySelector(".copy-code")
                            .getBoundingClientRect();
                        const open = node
                            .querySelector(".open-example")
                            .getBoundingClientRect();
                        return {
                            yCopy: copy.y,
                            yOpen: open.y,
                            gap: open.left - copy.right,
                            overflow:
                                document.documentElement.scrollWidth >
                                innerWidth,
                            editable: node
                                .querySelector(".cm-content")
                                .getAttribute("contenteditable"),
                            highlighted:
                                !!node.querySelector(".cm-csound-xml-tag")
                        };
                    });
                    assert.equal(layout.yCopy, layout.yOpen);
                    assert.equal(layout.gap, 8);
                    assert.equal(layout.overflow, false);
                    assert.equal(layout.editable, "false");
                    assert.equal(layout.highlighted, true);
                    await frame.waitForFunction(() => {
                        const code = document.querySelector(
                            '[data-example="oscili.csd"] .cm-scroller'
                        );
                        return (
                            code.clientHeight > 600 &&
                            code.scrollHeight <= code.clientHeight + 1 &&
                            code.scrollWidth <= code.clientWidth + 1
                        );
                    });
                    if (process.env.MANUAL_CODE_SCREENSHOTS) {
                        await frame.$eval(block, (node) => {
                            const header = document
                                .querySelector(".site-header")
                                .getBoundingClientRect();
                            window.scrollBy(
                                0,
                                node.getBoundingClientRect().top -
                                    header.height -
                                    16
                            );
                        });
                        await page.screenshot({
                            path: `${process.env.MANUAL_CODE_SCREENSHOTS}-${theme}-${width}.png`
                        });
                    }
                    await frame.click(`${block} .copy-code`);
                    const source = await frame.$eval(
                        `${block} pre code`,
                        (node) => {
                            const copy = node.cloneNode(true);
                            copy.querySelectorAll(".linenos").forEach((node) =>
                                node.remove()
                            );
                            return copy.textContent;
                        }
                    );
                    assert.equal(
                        await frame.evaluate(() => window.copiedCode),
                        source
                    );
                    assert.ok(
                        source.includes("</CsoundSynthesizer>"),
                        "Copy includes the full document, outside the visible viewport"
                    );
                    await frame.focus(`${block} .cm-content`);
                    await page.keyboard.type("should not edit");
                    await frame.click(`${block} .copy-code`);
                    assert.equal(
                        await frame.evaluate(() => window.copiedCode),
                        source
                    );
                    await frame.focus(`${block} .copy-code`);
                    await page.keyboard.press("Tab");
                    assert.equal(
                        await frame.evaluate(
                            () => document.activeElement.className
                        ),
                        "open-example"
                    );
                    await page.keyboard.press("Enter");
                    await page.waitForFunction(
                        () => window.opened.length === 1
                    );
                    assert.deepEqual(await page.evaluate(() => window.opened), [
                        `${target.baseUrl}/manual/examples/oscili.csd`
                    ]);
                    await frame.$eval(`${block} pre`, (node) => {
                        location.hash = Array.from(
                            node.querySelectorAll('span[id^="__span"]')
                        ).at(-1).id;
                    });
                    await frame.waitForFunction(() => {
                        const code = document.querySelector(
                            '[data-example="oscili.csd"] .cm-scroller'
                        );
                        const lastLine = [
                            ...code.querySelectorAll(".cm-line")
                        ].find((line) =>
                            line.textContent.includes("</CsoundSynthesizer>")
                        );
                        if (!lastLine) return false;
                        const bounds = lastLine.getBoundingClientRect();
                        return (
                            code.scrollTop === 0 &&
                            bounds.top >= 0 &&
                            bounds.bottom <= innerHeight
                        );
                    });
                    assert.ok(
                        await frame.$eval(`${block} .cm-content`, (node) =>
                            node.textContent.includes("</CsoundSynthesizer>")
                        ),
                        "Old line bookmarks reveal the requested code"
                    );
                    await page.emulateMediaType("print");
                    assert.equal(
                        await frame.$eval(
                            `${block} pre`,
                            (node) => getComputedStyle(node).display
                        ),
                        "block"
                    );
                    assert.equal(
                        await frame.$eval(
                            `${block} .code-preview`,
                            (node) => getComputedStyle(node).display
                        ),
                        "none"
                    );
                    await page.emulateMediaType("screen");
                }
            }
            assert.deepEqual(errors, []);
            assert.ok(
                requests.every(
                    (url) => url.origin === new URL(target.baseUrl).origin
                )
            );
        } finally {
            await browser.close();
        }
    }
);

test(
    "each syntax variant and example opens its own CSD",
    localOnly,
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const { page, errors } = await setup(browser);
            await page.goto(`${target.baseUrl}/manual-code-test`);
            for (const [opcode, filenames] of [
                [
                    "ampmidicurve",
                    ["ampmidicurve-modern.csd", "ampmidicurve.csd"]
                ],
                ["lpcfilter", ["lpcfilter.csd", "lpcfilter-2.csd"]],
                [
                    "reinit",
                    [
                        "reinit-modern.csd",
                        "reinit.csd",
                        "musical/Reinit_Giordani-modern.csd",
                        "musical/Reinit_Giordani.csd"
                    ]
                ]
            ]) {
                await page.$eval(
                    "iframe",
                    (node, name) => {
                        node.src = `/manual/opcodes/${name}/`;
                    },
                    opcode
                );
                await page.waitForFunction(
                    (name) =>
                        document
                            .querySelector("iframe")
                            .contentDocument.querySelector(
                                `[data-example="${name}"] .cm-editor`
                            ),
                    {},
                    filenames[0]
                );
                const frame = page
                    .frames()
                    .find((frame) =>
                        frame.url().includes(`/opcodes/${opcode}/`)
                    );
                assert.deepEqual(
                    await frame.$$eval("[data-example]", (nodes) =>
                        nodes.map((node) => node.dataset.example)
                    ),
                    filenames
                );
                for (const filename of filenames) {
                    // Select the upstream syntax tab before using its controls.
                    await frame.$eval(
                        `[data-example="${filename}"]`,
                        (node) => {
                            const group = node.closest(".tabbed-set");
                            if (group)
                                group
                                    .querySelectorAll(":scope > input")
                                    [
                                        Array.from(
                                            group.querySelectorAll(
                                                ":scope > .tabbed-content > .tabbed-block"
                                            )
                                        ).indexOf(node.closest(".tabbed-block"))
                                    ].click();
                        }
                    );
                    await frame.click(
                        `[data-example="${filename}"] .open-example`
                    );
                    await page.waitForFunction(
                        (name) =>
                            window.opened.some((url) =>
                                url.endsWith(`/examples/${name}`)
                            ),
                        {},
                        filename
                    );
                }
            }
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);

test(
    "manual skips unused code assets and retains usable fallback code",
    localOnly,
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const { page, errors, requests } = await setup(browser, true);
            await page.goto(`${target.baseUrl}/manual/`);
            assert.equal(
                requests.some((url) =>
                    url.pathname.endsWith("/manual-code.js")
                ),
                false
            );
            await page.goto(`${target.baseUrl}/manual-code-test`);
            await page.waitForFunction(() =>
                document
                    .querySelector("iframe")
                    .contentDocument.querySelector(".example-feedback")
                    ?.textContent.includes("unavailable")
            );
            const frame = page
                .frames()
                .find((frame) => frame.url().includes("/opcodes/oscili/"));
            assert.equal(
                await frame.$eval(
                    "[data-example] pre",
                    (node) => getComputedStyle(node).display
                ),
                "block"
            );
            await frame.click("[data-example] .copy-code");
            assert.ok(
                (await frame.evaluate(() => window.copiedCode)).includes(
                    "</CsoundSynthesizer>"
                )
            );
            await frame.click("[data-example] .open-example");
            await page.waitForFunction(() => window.opened.length === 1);
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);
