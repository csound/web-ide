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

async function clickControl(frame, selector) {
    await frame
        .locator(selector)
        .filter(async (node) => {
            // Focus and CodeMirror layout can scroll again after the first attempt.
            // Recenter on each poll, including controls covered by the sticky header.
            node.scrollIntoView({
                block: "center",
                inline: "nearest",
                behavior: "instant"
            });
            const before = node.getBoundingClientRect();
            await new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve))
            );
            const box = node.getBoundingClientRect();
            // Test the hit target after scrolling settles, not before it moves.
            return (
                box.x === before.x &&
                box.y === before.y &&
                box.width === before.width &&
                box.height === before.height &&
                node.contains(
                    document.elementFromPoint(
                        box.left + box.width / 2,
                        box.top + box.height / 2
                    )
                )
            );
        })
        .click();
}

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
    "manual code controls can be reached below the sticky header",
    localOnly,
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const { page } = await setup(browser);
            await page.setViewport({ width: 320, height: 900 });
            await page.goto(`${target.baseUrl}/manual-code-test`);
            const frame = page
                .frames()
                .find((frame) => frame.url().includes("/opcodes/oscili/"));
            const selector = '[data-example="oscili.csd"] .copy-code';
            await frame.waitForSelector(
                '[data-example="oscili.csd"] .cm-editor'
            );
            // A control may be inside the viewport but covered by the sticky links.
            await frame.waitForFunction(
                (selector) => {
                    const node = document.querySelector(selector);
                    const header = document
                        .querySelector(".site-header")
                        .getBoundingClientRect();
                    const button = node.getBoundingClientRect();
                    window.scrollBy(
                        0,
                        button.top +
                            button.height / 2 -
                            (header.top + header.height / 2)
                    );
                    const box = node.getBoundingClientRect();
                    return !!document
                        .elementFromPoint(
                            box.left + box.width / 2,
                            box.top + box.height / 2
                        )
                        ?.closest(".site-header");
                },
                {},
                selector
            );
            await clickControl(frame, selector);
            await frame.waitForFunction(
                () => window.copiedCode?.includes("</CsoundSynthesizer>"),
                { timeout: 5000 }
            );
            assert.equal(
                frame.url(),
                `${target.baseUrl}/manual/opcodes/oscili/`
            );
        } finally {
            await browser.close();
        }
    }
);

test(
    "readonly Csound previews keep a corner copy icon at every width and theme",
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
                        const button = node.querySelector(".copy-code");
                        const copy = button.getBoundingClientRect();
                        const surface = node
                            .querySelector(".code-surface")
                            .getBoundingClientRect();
                        return {
                            topInset: copy.top - surface.top,
                            rightInset: surface.right - copy.right,
                            copyLabel: button.getAttribute("aria-label"),
                            hasIcon: !!button.querySelector("svg"),
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
                    assert.equal(layout.topInset, 8);
                    assert.equal(layout.rightInset, 8);
                    assert.equal(layout.copyLabel, "Copy code");
                    assert.equal(layout.hasIcon, true);
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
                    await clickControl(frame, `${block} .copy-code`);
                    assert.equal(
                        await frame.$eval(
                            `${block} .copy-code-tooltip`,
                            (node) =>
                                getComputedStyle(node).visibility ===
                                    "visible" && node.textContent === "Copied"
                        ),
                        true
                    );
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
                    await clickControl(frame, `${block} .copy-code`);
                    assert.equal(
                        await frame.evaluate(() => window.copiedCode),
                        source
                    );
                    await frame.focus(`${block} .open-example`);
                    await page.keyboard.press("Tab");
                    assert.equal(
                        await frame.evaluate(
                            () => document.activeElement.className
                        ),
                        "copy-code"
                    );
                    assert.equal(
                        await frame.$eval(
                            `${block} .copy-code-tooltip`,
                            (node) => getComputedStyle(node).visibility
                        ),
                        "visible"
                    );
                    await frame.focus(`${block} .open-example`);
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
                    await clickControl(
                        frame,
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
            await clickControl(frame, "[data-example] .copy-code");
            assert.ok(
                (await frame.evaluate(() => window.copiedCode)).includes(
                    "</CsoundSynthesizer>"
                )
            );
            await clickControl(frame, "[data-example] .open-example");
            await page.waitForFunction(() => window.opened.length === 1);
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);
