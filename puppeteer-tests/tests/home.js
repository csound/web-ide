import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
    goto,
    gotoProjectFromHome,
    waitForProject,
    dumpDebugInfo
} from "../utils/browser.js";
import { getSession, closeSession } from "../utils/session.js";
import { target, targetName, TIMEOUT } from "../utils/config.js";

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
        "waits for the lazy app before navigating from home to the editor",
        { skip: targetName !== "local", timeout: TIMEOUT.NAVIGATION * 2 },
        async () => {
            const slowPage = await page.browser().newPage();
            let delayedApp = false;
            try {
                // Match the editor suite; narrow layouts keep the file tree in a drawer.
                await slowPage.setViewport({ width: 1280, height: 900 });
                await slowPage.setCacheEnabled(false);
                await slowPage.evaluateOnNewDocument((editorPath) => {
                    window.earlyEditorNavigation = false;
                    const pushState = history.pushState.bind(history);
                    history.pushState = (state, title, url) => {
                        if (
                            url === editorPath &&
                            !document.querySelector("main #search-projects")
                        ) {
                            window.earlyEditorNavigation = true;
                        }
                        pushState(state, title, url);
                    };
                }, new URL(target.projectUrl).pathname);
                await slowPage.setRequestInterception(true);
                slowPage.on("request", async (request) => {
                    if (
                        new URL(request.url()).pathname ===
                        "/src/components/main/main.tsx"
                    ) {
                        delayedApp = true;
                        // Simulate a slow lazy import while #root is already present.
                        await new Promise((resolve) =>
                            setTimeout(resolve, 1000)
                        );
                    }
                    if (!slowPage.isClosed()) await request.continue();
                });
                await gotoProjectFromHome(slowPage);
                assert.equal(
                    await slowPage.evaluate(() => window.earlyEditorNavigation),
                    false,
                    "The route changed before the app was ready to handle navigation"
                );
                assert.equal(
                    delayedApp,
                    true,
                    "Expected to delay the lazy app module"
                );
                await waitForProject(slowPage).catch(async (error) => {
                    await dumpDebugInfo(slowPage, "home-editor-navigation");
                    throw error;
                });
            } finally {
                await slowPage.close();
            }
        }
    );

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
