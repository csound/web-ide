import { strict as assert } from "node:assert";
import { mkdir } from "node:fs/promises";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS } from "../utils/config.js";

const base = process.env.SPECTROGRAM_TEST_URL || "http://localhost:3000";

test(
    "spectrogram renders real Csound tones, freezes, resizes and cleans up",
    {
        skip: process.env.RUN_SPECTROGRAM !== "1",
        timeout: 180000
    },
    async () => {
        assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
        const browser = await puppeteer.launch({
            ...BROWSER_SETTINGS,
            args: [
                ...BROWSER_SETTINGS.args.filter(
                    (arg) => arg !== "--disable-gpu"
                ),
                "--mute-audio",
                "--enable-unsafe-swiftshader"
            ]
        });
        await mkdir("puppeteer-tests/screenshots", { recursive: true });
        try {
            for (const variant of [
                {
                    name: "dark-webgl",
                    query: "tone",
                    width: 1000,
                    fallback: false
                },
                {
                    name: "light-canvas",
                    query: "tone&light&short",
                    width: 375,
                    fallback: true
                },
                {
                    name: "worker-webgl",
                    reduced: true,
                    query: "tone&worker&short",
                    width: 520,
                    fallback: false
                },
                {
                    name: "preview",
                    query: "",
                    width: 1000,
                    fallback: false,
                    preview: true
                }
            ]) {
                const page = await browser.newPage();
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.setViewport({
                    width: variant.width,
                    height: 500,
                    deviceScaleFactor: 2
                });
                await page.evaluateOnNewDocument((forceFallback) => {
                    window.spectralTest = {
                        frames: 0,
                        peak: 0,
                        connections: 0,
                        labels: [],
                        glErrors: []
                    };
                    const connected = new Set();
                    const connect = AudioNode.prototype.connect;
                    AudioNode.prototype.connect = function (...args) {
                        const result = connect.apply(this, args);
                        if (args[0] instanceof AnalyserNode)
                            connected.add(args[0]);
                        window.spectralTest.connections = connected.size;
                        return result;
                    };
                    const disconnect = AudioNode.prototype.disconnect;
                    AudioNode.prototype.disconnect = function (...args) {
                        if (args[0] instanceof AnalyserNode)
                            connected.delete(args[0]);
                        window.spectralTest.connections = connected.size;
                        return disconnect.apply(this, args);
                    };
                    const getContext = HTMLCanvasElement.prototype.getContext;
                    HTMLCanvasElement.prototype.getContext = function (
                        type,
                        ...args
                    ) {
                        if (forceFallback && type === "webgl") return null;
                        return getContext.call(this, type, ...args);
                    };
                    const inspect = (pixels, height, invert) => {
                        let best = 0,
                            peak = 0;
                        // A single 1 kHz tone is the brightest (or darkest) row.
                        const light = location.search.includes("light");
                        for (let row = 0; row < height; row++) {
                            const intensity =
                                pixels[row * 4] +
                                pixels[row * 4 + 1] +
                                pixels[row * 4 + 2];
                            const score = light ? 765 - intensity : intensity;
                            if (score > best) {
                                best = score;
                                peak = row;
                            }
                        }
                        window.spectralTest.frames++;
                        window.spectralTest.peak = invert
                            ? 1 - peak / height
                            : peak / height;
                    };
                    const draw = WebGLRenderingContext.prototype.drawArrays;
                    WebGLRenderingContext.prototype.drawArrays = function (
                        ...args
                    ) {
                        draw.apply(this, args);
                        const pixels = new Uint8Array(this.canvas.height * 4);
                        this.readPixels(
                            this.canvas.width - 1,
                            0,
                            1,
                            this.canvas.height,
                            this.RGBA,
                            this.UNSIGNED_BYTE,
                            pixels
                        );
                        inspect(pixels, this.canvas.height, false);
                        const error = this.getError();
                        if (error) window.spectralTest.glErrors.push(error);
                    };
                    const drawImage =
                        CanvasRenderingContext2D.prototype.drawImage;
                    CanvasRenderingContext2D.prototype.drawImage = function (
                        ...args
                    ) {
                        drawImage.apply(this, args);
                        if (
                            this.canvas.parentElement?.dataset.renderer !==
                            "canvas"
                        )
                            return;
                        inspect(
                            this.getImageData(
                                this.canvas.width - 1,
                                0,
                                1,
                                this.canvas.height
                            ).data,
                            this.canvas.height,
                            true
                        );
                    };
                    const fillText =
                        CanvasRenderingContext2D.prototype.fillText;
                    CanvasRenderingContext2D.prototype.fillText = function (
                        ...args
                    ) {
                        if (!window.spectralTest.labels.includes(args[0]))
                            window.spectralTest.labels.push(args[0]);
                        fillText.apply(this, args);
                    };
                }, variant.fallback);
                await page.setRequestInterception(true);
                page.on("request", (request) => {
                    if (
                        request.url().startsWith(base) ||
                        /^(data|blob):/.test(request.url())
                    )
                        void request.continue();
                    else void request.abort();
                });
                if (variant.reduced)
                    await page.emulateMediaFeatures([
                        { name: "prefers-reduced-motion", value: "reduce" }
                    ]);
                await page.goto(
                    `${base}/puppeteer-tests/fixtures/spectrogram.html?${variant.query}`
                );
                await page.waitForSelector('[aria-label="Analyzer view"]');
                assert.match(
                    await page.$eval("body", (node) => node.innerText),
                    /Run a project/
                );
                const click = async (text) => {
                    const button = await page.waitForSelector(
                        `button::-p-text(${text})`
                    );
                    await button.click();
                };
                await click("Run");
                if (variant.reduced) {
                    await page.waitForFunction(
                        () => window.spectralTest.connections === 1
                    );
                    const initialFrames = await page.evaluate(
                        () => window.spectralTest.frames
                    );
                    await new Promise((resolve) => setTimeout(resolve, 200));
                    assert.equal(
                        await page.evaluate(() => window.spectralTest.frames),
                        initialFrames
                    );
                    await page.click('[aria-label="Unfreeze analyzer"]');
                }
                if (variant.preview)
                    await page.waitForFunction(
                        () => window.spectralTest.frames >= 300
                    );
                await page.waitForFunction(
                    () =>
                        window.spectralTest.connections === 1 &&
                        window.spectralTest.frames >= 60 &&
                        Math.abs(
                            window.spectralTest.peak -
                                Math.log(1000 / 20) / Math.log(20000 / 20)
                        ) < 0.025
                );
                assert.equal(
                    await page.$eval(
                        '[data-testid="spectrogram-heatmap"]',
                        (node) => node.dataset.renderer
                    ),
                    variant.fallback ? "canvas" : "webgl"
                );
                await page.click('[aria-label="Freeze analyzer"]');
                const frozen = await page.evaluate(
                    () => window.spectralTest.frames
                );
                await new Promise((resolve) => setTimeout(resolve, 200));
                assert.equal(
                    await page.evaluate(() => window.spectralTest.frames),
                    frozen
                );
                await page.screenshot({
                    path: `puppeteer-tests/screenshots/spectrogram-${variant.name}.png`
                });
                await page.click('button[value="spectrum"]');
                await page.waitForSelector('canvas[aria-label^="Spectrum:"]');
                assert.ok(
                    (
                        await page.evaluate(() => window.spectralTest.labels)
                    ).includes("-100")
                );
                await page.click('button[value="spectrogram"]');
                await page.click('[aria-label="Unfreeze analyzer"]');
                await page.waitForFunction(
                    (before) => window.spectralTest.frames > before,
                    {},
                    frozen
                );
                await click("Pause audio");
                await page.waitForFunction(() =>
                    [...document.querySelectorAll('[role="status"]')].some(
                        (node) => node.textContent === "Paused"
                    )
                );
                const paused = await page.evaluate(
                    () => window.spectralTest.frames
                );
                await new Promise((resolve) => setTimeout(resolve, 150));
                assert.equal(
                    await page.evaluate(() => window.spectralTest.frames),
                    paused
                );
                await click("Resume audio");
                await page.waitForFunction(
                    (before) => window.spectralTest.frames > before,
                    {},
                    paused
                );
                await page.setViewport({
                    width: 320,
                    height: 500,
                    deviceScaleFactor: 1
                });
                assert.equal(
                    await page.evaluate(
                        () => document.documentElement.scrollWidth <= innerWidth
                    ),
                    true
                );
                if (!variant.fallback) {
                    await page.$eval(
                        '[data-testid="spectrogram-heatmap"] canvas',
                        (canvas) =>
                            canvas
                                .getContext("webgl")
                                .getExtension("WEBGL_lose_context")
                                .loseContext()
                    );
                    await page.waitForFunction(
                        () =>
                            document.querySelector(
                                '[data-testid="spectrogram-heatmap"]'
                            ).dataset.renderer === "canvas"
                    );
                }
                await click("Toggle panel");
                await page.waitForFunction(
                    () => window.spectralTest.connections === 0
                );
                await click("Toggle panel");
                await page.waitForFunction(
                    () => window.spectralTest.connections === 1
                );
                await click("Stop");
                await page.waitForFunction(
                    () => window.spectralTest.connections === 0
                );
                assert.deepEqual(
                    await page.evaluate(() => window.spectralTest.glErrors),
                    []
                );
                assert.deepEqual(errors, []);
                console.log(`${variant.name}: passed`);
                await page.close();
            }
        } finally {
            await browser.close();
        }
    }
);
