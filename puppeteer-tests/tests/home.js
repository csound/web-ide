import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { goto } from "../utils/browser.js";
import { getSession, closeSession } from "../utils/session.js";
import { targetName, TIMEOUT } from "../utils/config.js";

async function assertHomeContent(page) {
    // Network idle can occur while React's lazy Main import is still pending.
    const heading = await page.waitForSelector("main #search-projects", {
        visible: true,
        timeout: TIMEOUT.NAVIGATION
    });
    assert.equal(
        await heading.evaluate((element) => element.textContent),
        "Search"
    );
    await page.waitForSelector('main input[name="search-field"]', {
        visible: true,
        timeout: TIMEOUT.NAVIGATION
    });
}

describe(`Home [${targetName}]`, () => {
    let page;

    before(async () => {
        ({ page } = await getSession());
        await goto(page, "/");
    });

    after(async () => {
        await page?.close();
        await closeSession();
    });

    it("loads with a non-empty title", async () => {
        const title = await page.title();
        assert.ok(title.length > 0, "Page title should not be empty");
    });

    it("renders page content", async () => {
        await assertHomeContent(page);
    });

    it(
        "waits for the home controls when the app module loads slowly",
        { skip: targetName !== "local", timeout: TIMEOUT.NAVIGATION * 2 },
        async () => {
            const slowPage = await page.browser().newPage();
            let appRequest;
            try {
                await slowPage.setCacheEnabled(false);
                await slowPage.setRequestInterception(true);
                slowPage.on("request", (request) => {
                    if (
                        new URL(request.url()).pathname ===
                        "/src/components/main/main.tsx"
                    ) {
                        appRequest = request;
                    } else {
                        void request.continue();
                    }
                });
                await goto(slowPage, "/");
                assert.ok(appRequest, "Expected the lazy app module request");
                assert.equal(await slowPage.$("main #search-projects"), null);

                // Start the same readiness check with the app still pending.
                const content = assertHomeContent(slowPage).then(
                    () => undefined,
                    (error) => error
                );
                await appRequest.continue();
                const error = await content;
                if (error) throw error;
            } finally {
                await slowPage.close();
            }
        }
    );
});
