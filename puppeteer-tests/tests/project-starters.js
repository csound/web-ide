import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

for (const { backend, useSAB, isolated } of [
    {
        backend: "explicitly disabled shared memory",
        useSAB: false,
        isolated: true
    },
    { backend: "automatic worker fallback", isolated: false },
    { backend: "automatic shared-memory worker", isolated: true }
]) {
    test(
        `project starters play, release MIDI notes, and filter live input (${backend})`,
        { skip: targetName !== "local", timeout: 120000 },
        async () => {
            const directory = mkdtempSync(join(tmpdir(), "csound-starters-"));
            const microphone = join(directory, "microphone.wav");
            // Chrome loops this 440 Hz signal instead of opening a physical microphone.
            const wav = Buffer.alloc(44 + 48000 * 2);
            wav.write("RIFF");
            wav.writeUInt32LE(wav.length - 8, 4);
            wav.write("WAVEfmt ", 8);
            wav.writeUInt32LE(16, 16);
            wav.writeUInt16LE(1, 20);
            wav.writeUInt16LE(1, 22);
            wav.writeUInt32LE(48000, 24);
            wav.writeUInt32LE(96000, 28);
            wav.writeUInt16LE(2, 32);
            wav.writeUInt16LE(16, 34);
            wav.write("data", 36);
            wav.writeUInt32LE(wav.length - 44, 40);
            for (let i = 0; i < 48000; i++)
                wav.writeInt16LE(
                    Math.round(
                        8192 * Math.sin((2 * Math.PI * 440 * i) / 48000)
                    ),
                    44 + 2 * i
                );
            writeFileSync(microphone, wav);
            let browser;
            try {
                browser = await puppeteer.launch({
                    ...BROWSER_SETTINGS,
                    args: [
                        ...BROWSER_SETTINGS.args,
                        "--use-fake-device-for-media-stream",
                        "--use-fake-ui-for-media-stream",
                        `--use-file-for-fake-audio-capture=${microphone}`
                    ]
                });
                const page = await browser.newPage();
                await page.evaluateOnNewDocument(() => {
                    localStorage.setItem(
                        "csound-io-v1",
                        JSON.stringify({
                            inputChannel: 1,
                            sampleRate: 44100,
                            latency: "balanced"
                        })
                    );
                    // Exercise the real Web MIDI callback without needing hardware.
                    window.testMidiInput = Object.assign(new EventTarget(), {
                        name: "Test keyboard",
                        id: "test",
                        state: "connected",
                        open: async () => window.testMidiInput,
                        close: async () => window.testMidiInput
                    });
                    Object.defineProperty(navigator, "requestMIDIAccess", {
                        configurable: true,
                        value: async () =>
                            Object.assign(new EventTarget(), {
                                inputs: new Map([
                                    ["test", window.testMidiInput]
                                ])
                            })
                    });
                });
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.setRequestInterception(true);
                page.on("request", async (request) => {
                    const url = new URL(request.url());
                    if (
                        url.pathname ===
                            "/puppeteer-tests/fixtures/project-starters.html" &&
                        isolated
                    ) {
                        // Match the isolation headers on production, which Vite omits.
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
                    } else if (
                        url.origin === new URL(target.baseUrl).origin ||
                        ["blob:", "data:"].includes(url.protocol)
                    ) {
                        await request.continue();
                    } else {
                        await request.abort();
                    }
                });
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/project-starters.html`
                );
                await page.waitForFunction(() => !!window.starters);
                assert.equal(
                    await page.evaluate(() => crossOriginIsolated),
                    isolated
                );
                for (const template of [
                    "single-csd",
                    "split-csd",
                    "midi",
                    "audio-input"
                ]) {
                    assert.equal(
                        await page.evaluate(
                            (template, useSAB) =>
                                window.starters.start(template, useSAB),
                            template,
                            useSAB
                        ),
                        "playing"
                    );
                    assert.equal(
                        /Shared/.test(
                            await page.evaluate(() => window.starters.engine())
                        ),
                        isolated && useSAB !== false
                    );
                    assert.equal(
                        await page.evaluate(() => window.starters.sampleRate()),
                        44100
                    );
                    if (template === "midi") {
                        assert.ok(
                            (await page.evaluate(() =>
                                window.starters.level()
                            )) < 0.00001,
                            "MIDI waits quietly for notes"
                        );
                        await page.evaluate(() =>
                            window.starters.midi(144, 69, 100)
                        );
                    }
                    await page.waitForFunction(
                        () => window.starters.level() > 0.001
                    );
                    if (template === "midi") {
                        await page.evaluate(() =>
                            window.starters.midi(128, 69, 0)
                        );
                        await page.waitForFunction(
                            () => window.starters.level() < 0.00001
                        );
                        await page.evaluate(() =>
                            window.testMidiInput.dispatchEvent(
                                new MIDIMessageEvent("midimessage", {
                                    data: new Uint8Array([144, 60, 100])
                                })
                            )
                        );
                        await page.waitForFunction(
                            () => window.starters.level() > 0.001
                        );
                        await page.evaluate(() =>
                            window.testMidiInput.dispatchEvent(
                                new MIDIMessageEvent("midimessage", {
                                    data: new Uint8Array([128, 60, 0])
                                })
                            )
                        );
                        await page.waitForFunction(
                            () => window.starters.level() < 0.00001
                        );
                        assert.equal(
                            await page.evaluate(() => window.starters.busy()),
                            true,
                            "MIDI stays ready after note release"
                        );
                        await page.evaluate(() => window.starters.stop());
                    } else if (template === "audio-input") {
                        assert.ok(
                            (await page.evaluate(() =>
                                window.starters.level()
                            )) < 0.12,
                            "Live input starts at reduced gain"
                        );
                        await page.evaluate(() => window.starters.stop());
                    } else {
                        await page.waitForFunction(
                            () => !window.starters.busy()
                        );
                    }
                    assert.equal(
                        await page.evaluate(() => window.starters.busy()),
                        false
                    );
                    const log = await page.evaluate(() =>
                        window.starters.log()
                    );
                    assert.doesNotMatch(
                        log,
                        /PERF ERROR|error:|\b[1-9]\d* errors in performance/i,
                        log
                    );
                }
                assert.deepEqual(errors, []);
            } finally {
                await browser?.close();
                rmSync(directory, { recursive: true, force: true });
            }
        }
    );
}
