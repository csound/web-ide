import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target } from "../utils/config.js";

test(
    "public player works in a cross-origin iframe without isolation",
    {
        skip: process.env.RUN_EMBED !== "1",
        timeout: 120000
    },
    async () => {
        const base = process.env.EMBED_BASE_URL || target.baseUrl;
        const projectUid = new URL(target.projectUrl).pathname.split("/").pop();
        const playerUrl = `${base}/embed/${projectUid}`;
        const parent = createServer((_request, response) => {
            response.setHeader("Content-Type", "text/html");
            response.end(
                `<!doctype html><html lang="en"><title>Embedded Csound</title><iframe title="Csound player" src="${playerUrl}" width="320" height="360" allow="autoplay"></iframe></html>`
            );
        });
        await new Promise((resolve) => parent.listen(0, "127.0.0.1", resolve));
        const browser = await puppeteer.launch({
            ...BROWSER_SETTINGS,
            // Exercise the browser's normal user-gesture policy.
            args: BROWSER_SETTINGS.args.filter(
                (arg) => !arg.startsWith("--autoplay-policy")
            )
        });
        try {
            const page = await browser.newPage();
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(window, "localStorage", {
                    get() {
                        throw new DOMException(
                            "Third-party storage blocked",
                            "SecurityError"
                        );
                    }
                });
            });
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            await page.goto(`http://127.0.0.1:${parent.address().port}`, {
                waitUntil: "networkidle2"
            });
            const frame = page
                .frames()
                .find((candidate) => candidate.url() === playerUrl);
            assert.ok(frame);
            await frame.waitForSelector("select", { timeout: 60000 });
            assert.equal(
                await frame.evaluate(() => crossOriginIsolated),
                false
            );
            assert.equal(
                await frame.evaluate(
                    () => document.querySelector('[role="status"]').textContent
                ),
                "Ready"
            );
            assert.equal(
                await frame.evaluate(
                    () => document.documentElement.scrollWidth <= innerWidth
                ),
                true
            );
            const click = async (label) => {
                const button = await frame.$(
                    `::-p-aria(${label}[role="button"])`
                );
                assert.ok(button, `${label} button`);
                await button.click();
            };
            const status = (text) =>
                frame.waitForFunction(
                    (expected) =>
                        document.querySelector('[role="status"]')
                            ?.textContent === expected,
                    { timeout: 30000 },
                    text
                );
            await click("Play");
            await status("Playing");
            await click("Pause");
            await status("Paused");
            await click("Resume");
            await status("Playing");
            await click("Stop");
            await status("Ready");
            await click("Render audio");
            await frame.waitForSelector("a[download]", { timeout: 60000 });
            const header = await frame.evaluate(async () => {
                const url = document.querySelector("a[download]").href;
                const bytes = new Uint8Array(
                    await (await fetch(url)).arrayBuffer()
                );
                return {
                    magic: new TextDecoder().decode(bytes.slice(0, 4)),
                    size: bytes.length
                };
            });
            assert.equal(header.magic, "RIFF");
            assert.ok(header.size > 44, "render contains audio samples");
            await frame.waitForFunction(
                () => document.querySelector("audio")?.readyState >= 1
            );
            await frame.evaluate(() => document.querySelector("audio").play());
            assert.equal(
                await frame.evaluate(
                    () => document.querySelector("audio").paused
                ),
                false
            );
            await frame.evaluate(() => document.querySelector("audio").pause());
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
            parent.close();
        }
    }
);
