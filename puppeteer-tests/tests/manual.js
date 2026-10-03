import assert from "node:assert/strict";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

const harness = `<!doctype html><title>Manual delivery test</title>
<iframe id="manual" title="Manual"></iframe>
<script type="module">
import { ManualBridge } from '/src/components/project-editor/manual-bridge.ts';
const frame = document.querySelector('#manual');
window.messages = [];
window.bridge = new ManualBridge(message => {
    window.messages.push(message);
    frame.contentWindow.postMessage(message, location.origin);
});
window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === frame.contentWindow)
        window.bridge.receive(event.data);
});
frame.addEventListener('load', () => window.bridge.connect());
frame.src = '/manual/';
</script>`;

for (const scenario of ["document", "lookup table"]) {
    test(
        `manual keeps the newest lookup while the ${scenario} loads`,
        { skip: targetName !== "local", timeout: 60000 },
        async () => {
            const browser = await puppeteer.launch(BROWSER_SETTINGS);
            try {
                const page = await browser.newPage();
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                let heldRequest;
                let intercepted = false;
                const requestedPages = [];
                await page.setRequestInterception(true);
                page.on("request", (request) => {
                    const url = new URL(request.url());
                    if (url.pathname === "/manual-delivery-test") {
                        void request.respond({
                            status: 200,
                            contentType: "text/html",
                            body: harness
                        });
                    } else if (
                        !intercepted &&
                        url.pathname ===
                            (scenario === "document"
                                ? "/manual/opcodes/oscili/"
                                : "/manual/lookup.json")
                    ) {
                        intercepted = true;
                        heldRequest = request;
                    } else {
                        if (request.resourceType() === "document")
                            requestedPages.push(url.pathname);
                        void request.continue();
                    }
                });
                await page.goto(`${target.baseUrl}/manual-delivery-test`);
                await page.waitForFunction(() => window.bridge?.isReady);
                await page.evaluate(() => window.bridge.lookup("oscili"));
                const deadline = Date.now() + 15000;
                while (!heldRequest && Date.now() < deadline)
                    await new Promise((resolve) => setTimeout(resolve, 20));
                assert.ok(
                    heldRequest,
                    "The requested response should be held back"
                );
                if (scenario === "document")
                    await page.waitForFunction(() => !window.bridge.isReady);
                await page.evaluate(() => window.bridge.lookup("ampmidicurve"));
                await heldRequest.continue();
                await page.waitForFunction(
                    () =>
                        document.querySelector("#manual").contentWindow.location
                            .pathname === "/manual/opcodes/ampmidicurve/"
                );
                await page.waitForFunction(() => window.bridge.isReady);
                assert.deepEqual(errors, []);
                if (scenario === "lookup table")
                    assert.equal(
                        requestedPages.includes("/manual/opcodes/oscili/"),
                        false,
                        "An older lookup must not win the fetch race"
                    );
            } finally {
                await browser.close();
            }
        }
    );
}

const localOnly = { skip: targetName !== "local", timeout: 60000 };

test(
    "manual search fills the view and supports keyboard navigation",
    localOnly,
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const page = await browser.newPage();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            for (const width of [320, 390, 768, 1440]) {
                await page.setViewport({ width, height: 800 });
                await page.goto(`${target.baseUrl}/manual/`);
                assert.equal(
                    await page.$eval("article h1", (node) => node.textContent),
                    "Opcode index"
                );
                assert.ok(
                    await page.$$eval(
                        ".opcode-list a",
                        (nodes) => nodes.length > 1000
                    )
                );
                assert.equal(await page.$("#theme-toggle"), null);
                assert.equal(
                    await page.evaluate(
                        () => document.documentElement.scrollWidth > innerWidth
                    ),
                    false
                );
                await page.click("#search-open");
                assert.equal(
                    await page.evaluate(() => document.activeElement.id),
                    "search"
                );
                await page.type("#search", "oscili");
                await page.waitForFunction(
                    () =>
                        document.querySelector("#search-results strong")
                            ?.textContent === "oscili"
                );
                const layout = await page.evaluate(() => {
                    const bounds = document
                        .querySelector("#search-panel")
                        .getBoundingClientRect();
                    return {
                        x: bounds.x,
                        y: bounds.y,
                        width: bounds.width,
                        height: bounds.height,
                        overflow:
                            document.querySelector("#search-panel")
                                .scrollWidth > innerWidth
                    };
                });
                assert.deepEqual(layout, {
                    x: 0,
                    y: 0,
                    width,
                    height: 800,
                    overflow: false
                });
                const titles = await page.$$eval(
                    "#search-results strong",
                    (nodes) => nodes.map((node) => node.textContent)
                );
                assert.ok(titles.includes("Basic Oscillators"));
                assert.ok(titles.every((title) => !title.includes("**")));
                await page.evaluate(() =>
                    document.querySelector(".brand").focus()
                );
                assert.equal(
                    await page.evaluate(() => document.activeElement.id),
                    "search",
                    "The page behind the modal must remain inert"
                );
                await page.keyboard.press("Tab");
                assert.equal(
                    await page.evaluate(() => document.activeElement.id),
                    "search-close"
                );
                await page.keyboard.down("Shift");
                await page.keyboard.press("Tab");
                await page.keyboard.up("Shift");
                assert.equal(
                    await page.evaluate(() => document.activeElement.id),
                    "search"
                );
                await page.keyboard.press("ArrowDown");
                assert.equal(
                    await page.evaluate(() =>
                        document.activeElement.textContent.startsWith("oscili")
                    ),
                    true
                );
                await page.evaluate(() => {
                    document.querySelector(".search-body").scrollTop = 2000;
                });
                assert.ok(
                    await page.$eval(
                        "#search-close",
                        (node) => node.getBoundingClientRect().top >= 0
                    )
                );
                await page.keyboard.press("Escape");
                assert.equal(
                    await page.evaluate(
                        () => document.querySelector("#search-panel").open
                    ),
                    false
                );
                assert.equal(
                    await page.evaluate(() => document.activeElement.id),
                    "search-open"
                );
                await page.keyboard.press("/");
                await page.click("#search-close");
                assert.equal(
                    await page.evaluate(
                        () => document.querySelector("#search-panel").open
                    ),
                    false
                );
            }
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);

test(
    "standalone manual follows the saved IDE theme and global default",
    localOnly,
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const page = await browser.newPage();
            await page.goto(`${target.baseUrl}/manual/`);
            const getBackground = () =>
                page.evaluate(
                    () =>
                        getComputedStyle(document.documentElement)
                            .backgroundColor
                );
            assert.equal(await getBackground(), "rgb(34, 35, 38)");
            const settings = await browser.newPage();
            await settings.goto(`${target.baseUrl}/manual/`);
            for (const [name, background] of Object.entries({
                github: "rgb(13, 17, 23)",
                "github-light": "rgb(255, 255, 255)",
                dracula: "rgb(15, 17, 23)",
                nord: "rgb(46, 52, 64)",
                "solarized-dark": "rgb(0, 43, 54)",
                monokai: "rgb(34, 35, 38)"
            })) {
                await settings.evaluate((name) => {
                    localStorage.setItem("manual-theme", "light");
                    localStorage.setItem("theme", name);
                }, name);
                await page.waitForFunction(
                    (color) =>
                        getComputedStyle(document.documentElement)
                            .backgroundColor === color,
                    {},
                    background
                );
                await page.reload();
                assert.equal(await getBackground(), background);
            }
            await settings.evaluate(() =>
                localStorage.setItem("theme", "unknown")
            );
            await page.reload();
            assert.equal(await getBackground(), "rgb(34, 35, 38)");
        } finally {
            await browser.close();
        }
    }
);
