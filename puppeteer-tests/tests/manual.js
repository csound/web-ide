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
