import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

// Replace cloud subscriptions only: UI, playback controller, WASM and audio are real.
const mocks = {
    "/src/components/projects/subscribers.tsx":
        "export const subscribeToProjectChanges = () => () => {}; export const subscribeToProjectFilesChanges = () => () => {}; export const subscribeToProjectTargetsChanges = () => () => {};",
    "/src/components/project-last-modified/subscribers.tsx":
        "export const subscribeToProjectLastModified = async () => () => {};",
    "/src/components/profile/subscribers.tsx": [
        "subscribeToProfile",
        "subscribeToFollowing",
        "subscribeToFollowers",
        "subscribeToProjectsCount",
        "subscribeToProfileStars",
        "subscribeToProfileProjects"
    ]
        .map((name) => `export const ${name} = () => () => {};`)
        .join("\n")
};

for (const sab of [false, true]) {
    test(
        `project switching and editor cleanup (SAB: ${sab})`,
        { skip: targetName !== "local", timeout: 120000 },
        async () => {
            const browser = await puppeteer.launch(BROWSER_SETTINGS);
            try {
                const page = await browser.newPage();
                await page.setViewport({ width: 1280, height: 900 });
                await page.evaluateOnNewDocument(
                    (enabled) => localStorage.setItem("sab", String(enabled)),
                    sab
                );
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.setRequestInterception(true);
                page.on("request", async (request) => {
                    const url = new URL(request.url());
                    if (
                        url.pathname ===
                            "/puppeteer-tests/fixtures/project-playback.html" &&
                        sab
                    ) {
                        // Vite does not set the isolation headers used by production.
                        const response = await fetch(request.url());
                        await request.respond({
                            status: response.status,
                            contentType: "text/html",
                            headers: {
                                "Cross-Origin-Opener-Policy": "same-origin",
                                "Cross-Origin-Embedder-Policy": "require-corp"
                            },
                            body: await response.text()
                        });
                    } else if (mocks[url.pathname])
                        void request.respond({
                            status: 200,
                            contentType: "application/javascript",
                            body: mocks[url.pathname]
                        });
                    else if (
                        url.origin === new URL(target.baseUrl).origin ||
                        ["blob:", "data:"].includes(url.protocol)
                    )
                        void request.continue();
                    else void request.abort();
                });
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/project-playback.html`
                );
                if (sab)
                    assert.equal(
                        await page.evaluate(() => crossOriginIsolated),
                        true
                    );
                const button = (name) => `::-p-aria(${name}[role="button"])`;
                const click = async (name) => {
                    try {
                        const control = await page.waitForSelector(
                            button(name)
                        );
                        await page.waitForFunction(
                            (element) => !element.disabled,
                            {},
                            control
                        );
                        await control.click();
                    } catch (error) {
                        mkdirSync("screenshots", { recursive: true });
                        await page.screenshot({
                            path: `screenshots/project-playback-${sab}.png`
                        });
                        writeFileSync(
                            `screenshots/project-playback-${sab}.html`,
                            await page.content()
                        );
                        throw new Error(`Could not click ${name}`, {
                            cause: error
                        });
                    }
                };
                const wait = async (name) => {
                    await page.waitForSelector(button(name));
                };
                const stopped = async () => {
                    await page
                        .waitForFunction(
                            () =>
                                document.querySelector(
                                    '[aria-label="Engine status"]'
                                ).textContent === "stopped" &&
                                !window.playbackFixture.busy()
                        )
                        .catch(async (error) => {
                            console.error(
                                await page.evaluate(() => ({
                                    status: document.querySelector(
                                        '[aria-label="Engine status"]'
                                    ).textContent,
                                    busy: window.playbackFixture.busy()
                                })),
                                errors
                            );
                            throw error;
                        });
                };
                await click("Play First");
                await wait("Pause First");
                await click("Hide First");
                await page.waitForSelector(button("Pause First"), {
                    hidden: true
                });
                assert.equal(
                    await page.evaluate(() =>
                        window.playbackFixture.live("First")
                    ),
                    true
                );
                await click("Show First");
                await wait("Pause First");
                await click("Pause First");
                await click("Play Second");
                await wait("Pause Second");
                // Also switch without pausing first, then repeat the reported direction.
                await click("Play First");
                await wait("Pause First");
                await click("Pause First");
                await click("Play Second");
                await wait("Pause Second");
                await click("Open First editor");
                await stopped();
                await click("Play project.csd");
                await wait("Pause playback");
                await click("Pause playback");
                await click("Leave editor");
                await stopped();
                await click("Play Second");
                await wait("Pause Second");
                await click("Open First editor");
                await stopped();
                // WebMCP bypasses the playlist controller; leaving must stop it too.
                await click("Play direct engine");
                await wait("Pause playback");
                await click("Leave editor");
                await stopped();
                await click("Play First");
                await wait("Pause First");
                assert.deepEqual(errors, []);
            } finally {
                await browser.close();
            }
        }
    );
}
