import assert from "node:assert/strict";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

test(
    "I/O dialogs save choices, release test devices, and fit light, dark and narrow views",
    { skip: targetName !== "local", timeout: 90000 },
    async () => {
        const browser = await puppeteer.launch({
            ...BROWSER_SETTINGS,
            args: [
                ...BROWSER_SETTINGS.args,
                "--use-fake-device-for-media-stream",
                "--use-fake-ui-for-media-stream"
            ]
        });

        try {
            const page = await browser.newPage();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            await page.setRequestInterception(true);
            page.on("request", (request) =>
                new URL(request.url()).origin ===
                    new URL(target.baseUrl).origin ||
                /^(blob|data):/.test(request.url())
                    ? request.continue()
                    : request.abort()
            );
            await page.evaluateOnNewDocument(() => {
                window.testStreams = [];
                const capture = navigator.mediaDevices.getUserMedia.bind(
                    navigator.mediaDevices
                );
                navigator.mediaDevices.getUserMedia = async (options) => {
                    const stream = await capture(options);
                    window.testStreams.push(stream);
                    return stream;
                };
                const access = Object.assign(new EventTarget(), {
                    inputs: new Map([
                        [
                            "keyboard",
                            {
                                id: "keyboard",
                                name: "USB Keyboard",
                                state: "connected"
                            }
                        ]
                    ])
                });
                window.testMidiRequests = 0;
                Object.defineProperty(navigator, "requestMIDIAccess", {
                    configurable: true,
                    value: async () => {
                        window.testMidiRequests++;
                        return access;
                    }
                });
            });
            const click = async (name) => {
                await page.locator(`button::-p-text(${name})`).click();
                if (["Cancel", "Save"].includes(name))
                    await page.waitForFunction(
                        () => !document.querySelector(".MuiModal-root")
                    );
                if (["input", "output", "midi"].includes(name))
                    await page.waitForFunction(() => {
                        const modal = document.querySelector("#modal-window");
                        return modal && getComputedStyle(modal).opacity === "1";
                    });
            };
            for (const light of [false, true]) {
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/io-settings.html${light ? "?light" : ""}`
                );
                await click("input");
                await page.waitForSelector('[role="dialog"]');
                assert.equal(
                    await page.evaluate(() => window.testStreams.length),
                    0,
                    "opening settings does not request devices"
                );
                await page.screenshot({
                    path: `/tmp/io-input-${light ? "light" : "dark"}.png`
                });
                await click("Test input");
                await page.waitForFunction(() =>
                    window.testStreams.some((stream) => stream.active)
                );
                await click("Cancel");
                await page.waitForFunction(() =>
                    window.testStreams.every((stream) => !stream.active)
                );
                await click("output");
                await click("Test sound");
                await page.waitForFunction(() =>
                    [...document.querySelectorAll("button")].some(
                        (button) => button.textContent === "Test sound"
                    )
                );
                await page.locator("summary::-p-text(Advanced)").click();
                await page.screenshot({
                    path: `/tmp/io-output-${light ? "light" : "dark"}.png`
                });
                await click("Cancel");
                await click("midi");
                assert.equal(
                    await page.evaluate(() => window.testMidiRequests),
                    0
                );
                await click("Connect MIDI");
                await page.waitForSelector("label::-p-text(USB Keyboard)");
                await page
                    .locator("label::-p-text(Use all controllers)")
                    .click();
                await page.locator("label::-p-text(USB Keyboard)").click();
                await page.screenshot({
                    path: `/tmp/io-midi-${light ? "light" : "dark"}.png`
                });
                await click("Save");
                assert.deepEqual(
                    await page.evaluate(
                        () =>
                            JSON.parse(localStorage.getItem("csound-io-v1"))
                                .midiInputs
                    ),
                    []
                );
                await click("midi");
                await click("Reset");
                await click("Save");
                assert.equal(
                    await page.evaluate(
                        () =>
                            JSON.parse(localStorage.getItem("csound-io-v1"))
                                .midiInputs
                    ),
                    "all"
                );
            }
            await page.setViewport({ width: 360, height: 640 });
            await click("input");
            await page.screenshot({ path: "/tmp/io-input-mobile.png" });
            assert.equal(
                await page.evaluate(() => {
                    const dialog = document
                        .querySelector('[role="dialog"]')
                        .getBoundingClientRect();
                    return (
                        dialog.left >= 0 &&
                        dialog.right <= innerWidth &&
                        dialog.top >= 0 &&
                        dialog.bottom <= innerHeight
                    );
                }),
                true
            );
            await page.keyboard.press("Escape");
            await page.waitForFunction(
                () => !document.querySelector('[role="dialog"]')
            );
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);

test(
    "an embedded piece chooses MessageChannel audio without isolation headers",
    { skip: targetName !== "local", timeout: 60000 },
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on("request", (request) =>
                new URL(request.url()).origin ===
                    new URL(target.baseUrl).origin ||
                /^(blob|data):/.test(request.url())
                    ? request.continue()
                    : request.abort()
            );
            await page.goto(
                `${target.baseUrl}/puppeteer-tests/fixtures/io-settings.html`
            );
            await page.evaluate(() => {
                const iframe = document.createElement("iframe");
                iframe.src = "/puppeteer-tests/fixtures/project-starters.html";
                iframe.allow = "autoplay";
                document.body.append(iframe);
            });
            await page.waitForFrame((frame) =>
                frame.url().endsWith("project-starters.html")
            );
            const frame = page
                .frames()
                .find((frame) => frame.url().endsWith("project-starters.html"));
            await frame.waitForFunction(() => !!window.starters);
            assert.equal(
                await frame.evaluate(() => crossOriginIsolated),
                false
            );
            assert.equal(
                await frame.evaluate(() => window.starters.start("single-csd")),
                "playing"
            );
            assert.equal(
                /Shared/.test(
                    await frame.evaluate(() => window.starters.engine())
                ),
                false
            );
            await frame.waitForFunction(() => window.starters.level() > 0.001);
            await frame.evaluate(() => window.starters.stop());
            assert.equal(
                await frame.evaluate(() => window.starters.busy()),
                false
            );
        } finally {
            await browser.close();
        }
    }
);
