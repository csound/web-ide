import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

test(
    "Mixer renders current settings, exports, and fits both themes and narrow panels",
    { skip: targetName !== "local", timeout: 90000 },
    async () => {
        const browser = await puppeteer.launch(BROWSER_SETTINGS);
        const page = await browser.newPage();
        const errors = [];
        const wasm = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("request", (request) => {
            const url = new URL(request.url());
            if (url.pathname.endsWith(".wasm") && !url.searchParams.has("url"))
                wasm.push(url.pathname);
        });
        const click = async (name) =>
            page.locator(`button ::-p-text(${name})`).click();
        const ready = async () => {
            await page.waitForFunction(
                () =>
                    document
                        .querySelector('[aria-label="Mixer"]')
                        .getAttribute("aria-busy") === "false" &&
                    (document.querySelector("audio[src]") ||
                        document.querySelector("[role=alert]"))
            );
            assert.equal(
                await page.$eval(
                    '[aria-label="Mixer"]',
                    (node) =>
                        node.querySelector("[role=alert]")?.textContent || ""
                ),
                ""
            );
        };
        const input = async (label, value) =>
            page.$eval(
                `input[aria-label="${label}"]`,
                (node, next) => {
                    Object.getOwnPropertyDescriptor(
                        HTMLInputElement.prototype,
                        "value"
                    ).set.call(node, next);
                    node.dispatchEvent(new Event("input", { bubbles: true }));
                },
                value
            );
        try {
            await page.setViewport({ width: 1100, height: 950 });
            await page.goto(
                `${target.baseUrl}/puppeteer-tests/fixtures/mixer.html`,
                { waitUntil: "networkidle0" }
            );
            assert.deepEqual(wasm, [], "opening the mixer must not fetch WASM");
            await page.select(
                'select[aria-label="Project audio file"]',
                "pulse.wav"
            );
            await ready();
            assert.ok(wasm.some((url) => url.endsWith("/mixer.wasm")));
            assert.ok(!wasm.some((url) => url.endsWith("/src_conv.wasm")));
            await page.select(
                'select[aria-label="Project audio file"]',
                "chimes.wav"
            );
            await ready();
            assert.ok(
                wasm.some((url) => url.endsWith("/src_conv.wasm")),
                "different rates resample on import"
            );
            assert.equal((await page.$$("audio")).length, 1);
            await input("Mix volume", "0.3");
            const before = wasm.length;
            await input("Track 2 start", "0.25");
            await input("Track 2 start", "0.5");
            await input("Track 2 start", "0.75");
            assert.equal(
                await page.$eval('[aria-label="Mixer"]', (node) =>
                    node.getAttribute("aria-busy")
                ),
                "true"
            );
            assert.ok(await page.$("[role=progressbar]"));
            assert.ok(await page.$eval("audio", (node) => node.paused));
            assert.ok(
                await page.$eval(
                    '[aria-label="Play mix"]',
                    (node) => node.disabled
                )
            );
            await ready();
            assert.equal(wasm.length - before, 1, "rapid edits run one mix");
            assert.ok(
                Math.abs(
                    (await page.$eval("audio", (node) => node.volume)) - 0.3
                ) < 0.001
            );
            await page.waitForFunction(
                () =>
                    Math.abs(document.querySelector("audio").duration - 2.75) <
                    0.001
            );
            assert.match(
                await page.$eval(
                    '[aria-label="Changes"]',
                    (node) => node.textContent
                ),
                /0.75 s/
            );
            await page.click('[aria-label="Move chimes.wav"]');
            await page.keyboard.press("ArrowRight");
            await ready();
            assert.equal(
                await page.$eval(
                    '[aria-label="Track 2 start"]',
                    (node) => node.value
                ),
                "0.76"
            );
            const clip = await page.$('[aria-label="Move chimes.wav"]');
            const box = await clip.boundingBox();
            await page.mouse.move(box.x + 12, box.y + box.height / 2);
            await page.mouse.down();
            await page.mouse.move(box.x + 112, box.y + box.height / 2, {
                steps: 4
            });
            await page.mouse.up();
            await ready();
            const positioned = () =>
                page.$eval('[aria-label="Move chimes.wav"]', (node) => {
                    const lane = node.parentElement.getBoundingClientRect();
                    const clip = node.getBoundingClientRect();
                    const start = Number(node.getAttribute("aria-valuenow"));
                    const span = Math.max(2, (start + 2) * 1.2);
                    return (
                        Math.abs(
                            (clip.left - lane.left) / lane.width - start / span
                        ) < 0.005
                    );
                });
            assert.ok(
                await positioned(),
                "drag uses the updated timeline scale"
            );
            await input("Track 2 start", "0.5");
            await ready();
            assert.ok(
                await positioned(),
                "numeric edits replace the drag position"
            );
            await page.click('[aria-label="Solo track 2"]');
            await ready();
            assert.equal(
                await page.$eval('[aria-label="Solo track 2"]', (node) =>
                    node.getAttribute("aria-pressed")
                ),
                "true"
            );
            await page.click('[aria-label="Play mix"]');
            await page.waitForFunction(
                () => document.querySelector("audio").currentTime > 0.1
            );
            await page.click('[aria-label="Pause mix"]');
            await mkdir("screenshots", { recursive: true });
            await page.screenshot({ path: "screenshots/mixer-dark.png" });
            await click("Add to project");
            await page.waitForFunction(() =>
                document.body.textContent.includes("Added mix.wav")
            );
            assert.ok(await page.$('select option[value="mix.wav"]'));
            await click("Clear all changes");
            await ready();
            assert.equal(
                (await page.$$('[aria-label="Changes"] li')).length,
                0
            );
            assert.equal(
                await page.$eval(
                    '[aria-label="Track 2 start"]',
                    (node) => node.value
                ),
                "0"
            );
            assert.ok(await positioned(), "reset restores the visual position");
            await input("Track 2 start", "-1");
            await page.waitForSelector("[role=alert]");
            assert.ok(
                await page.$eval(
                    '[aria-label="Play mix"]',
                    (node) => node.disabled
                )
            );
            await click("Clear all changes");
            await ready();
            await page.click('[aria-label="Remove track 2"]');
            await ready();
            assert.equal(
                (await page.$$('[aria-label="Mix tracks"] > li')).length,
                1
            );
            await page.click('[aria-label="Remove track 1"]');
            assert.equal((await page.$$("audio")).length, 0);
            for (const light of [false, true]) {
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/mixer.html${light ? "?light" : ""}`
                );
                await page.select(
                    'select[aria-label="Project audio file"]',
                    "pulse.wav"
                );
                await ready();
                await page.select(
                    'select[aria-label="Project audio file"]',
                    "chimes.wav"
                );
                await ready();
                await input("Track 2 start", "0.5");
                await ready();
                if (light)
                    await page.screenshot({
                        path: "screenshots/mixer-light.png"
                    });
                await page.setViewport({ width: 390, height: 844 });
                assert.ok(
                    await page.$eval(
                        '[aria-label="Mixer"]',
                        (node) => node.scrollWidth <= node.clientWidth + 1
                    )
                );
                await page.screenshot({
                    path: `screenshots/mixer-mobile-${light ? "light" : "dark"}.png`
                });
                await page.setViewport({ width: 1100, height: 950 });
            }
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);
