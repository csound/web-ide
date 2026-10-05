import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
    mkdtempSync,
    mkdirSync,
    writeFileSync,
    readFileSync,
    rmSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getSession, closeSession } from "../utils/session.js";
import {
    gotoProject,
    waitForProject,
    dumpDebugInfo,
    attachPageDebugListeners
} from "../utils/browser.js";
import { targetName } from "../utils/config.js";

// Exercise the shipped commands in a real browser, including asset requests.
describe("Visual audio tools", { skip: targetName !== "local" }, () => {
    let page, directory, fixture;
    const wasm = [];
    const sample = 'section[aria-label="Sample Editor"]:not([data-testid])';
    const analysis = 'section[aria-label="Audio Analysis"]:not([data-testid])';
    /** Click the exact labelled button inside one tool window. */
    async function click(section, text) {
        for (const button of await page.$$(`${section} button`)) {
            if (
                (await button.evaluate((node) => node.textContent.trim())) ===
                text
            ) {
                await button.asLocator().click();
                return;
            }
        }
        throw new Error(`Missing button: ${text}`);
    }
    /** Save an optional screenshot for visual checks. */
    async function snapshot(name) {
        if (!process.env.AUDIO_TOOLS_SCREENSHOTS) return;
        mkdirSync(process.env.AUDIO_TOOLS_SCREENSHOTS, { recursive: true });
        await page.screenshot({
            path: join(process.env.AUDIO_TOOLS_SCREENSHOTS, `${name}.png`)
        });
    }
    /** Choose the local tone fixture and wait for its audio preview. */
    async function upload(section) {
        const input = await page.$(`${section} input[type=file]`);
        await input.uploadFile(fixture);
        await page.waitForSelector(`${section} audio[src]`);
    }
    /** Wait for a named result and fail if the tool reports an error. */
    async function result(section, filename) {
        await page.waitForFunction(
            (selector, name) =>
                Array.from(
                    document.querySelectorAll(`${selector} [role=status]`)
                ).some((node) => node.textContent === name),
            { timeout: 30000 },
            section,
            filename
        );
        assert.equal(await page.$(`${section} [role=alert]`), null);
    }
    before(async () => {
        ({ page } = await getSession());
        attachPageDebugListeners(page);
        page.on("request", (request) => {
            if (
                /\.wasm$/.test(new URL(request.url()).pathname) &&
                !new URL(request.url()).searchParams.has("url")
            )
                wasm.push(request.url());
        });
        directory = mkdtempSync(join(tmpdir(), "csound-audio-tools-"));
        fixture = join(directory, "tone.wav");
        const rate = 16000,
            frames = rate * 2,
            bytes = Buffer.alloc(44 + frames * 2);
        bytes.write("RIFF");
        bytes.writeUInt32LE(bytes.length - 8, 4);
        bytes.write("WAVEfmt ", 8);
        bytes.writeUInt32LE(16, 16);
        bytes.writeUInt16LE(1, 20);
        bytes.writeUInt16LE(1, 22);
        bytes.writeUInt32LE(rate, 24);
        bytes.writeUInt32LE(rate * 2, 28);
        bytes.writeUInt16LE(2, 32);
        bytes.writeUInt16LE(16, 34);
        bytes.write("data", 36);
        bytes.writeUInt32LE(frames * 2, 40);
        for (let index = 0; index < frames; index++)
            bytes.writeInt16LE(
                Math.round(
                    8000 *
                        Math.sin((2 * Math.PI * 220 * index) / rate) *
                        (0.2 + (0.8 * index) / frames)
                ),
                44 + index * 2
            );
        writeFileSync(fixture, bytes);
        await gotoProject(page);
        await waitForProject(page);
    });
    after(async () => {
        await page?.close();
        await closeSession();
        if (directory) rmSync(directory, { recursive: true, force: true });
    });
    it("keeps View toggles current after opening and closing each audio tool", async () => {
        for (const [label, section] of [
            ["Sample Editor", sample],
            ["Audio Analysis", analysis]
        ]) {
            for (const wasOpen of [false, true, false, true]) {
                await page.locator("span ::-p-text(View)").click();
                let item;
                for (const option of await page.$$("[role=menuitem]")) {
                    if (
                        await option.evaluate(
                            (element, name) =>
                                element.textContent.trim() === name,
                            label
                        )
                    ) {
                        item = option;
                        break;
                    }
                }
                assert.ok(item, `Missing View item: ${label}`);
                const checked = await item.evaluate((element) =>
                    Boolean(element.querySelector("svg"))
                );
                assert.equal(checked, wasOpen);
                await item.asLocator().click();
                await page.waitForSelector(
                    section,
                    wasOpen ? { hidden: true } : { visible: true }
                );
            }
        }
        assert.equal(wasm.length, 0);
    });
    it("opens and loads audio without downloading WASM, then fetches only the chosen tool", async () => {
        try {
            await page.click('[data-testid="sidebar-bottom-sampleEditor"]');
            await page.waitForSelector(`${sample} input[type=file]`);
            assert.equal(wasm.length, 0);
            await upload(sample);
            assert.equal(wasm.length, 0);
            await page.$eval(
                `${sample} input[aria-label="Selection start"]`,
                (input) => {
                    const set = Object.getOwnPropertyDescriptor(
                        HTMLInputElement.prototype,
                        "value"
                    ).set;
                    set.call(input, "0.5");
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                }
            );
            await click(sample, "Apply");
            await result(sample, "tone-trim.wav");
            assert.equal(wasm.length, 0);
            await page.waitForFunction(
                (selector) => {
                    const players = document.querySelectorAll(
                        `${selector} audio`
                    );
                    return Math.abs(players[1].duration - 1.5) < 0.001;
                },
                {},
                sample
            );
            await click(sample, "Keep result");
            await page.waitForFunction(
                (selector) =>
                    document
                        .querySelector(selector)
                        ?.textContent.includes("Added tone-trim.wav"),
                {},
                sample
            );
            await snapshot("sample-dark");
            await click(sample, "Gain");
            await click(sample, "Apply");
            await result(sample, "tone-gain.wav");
            assert.ok(wasm.some((url) => url.includes("scale")));
            assert.ok(
                wasm.every((url) => url.includes("scale")),
                wasm.join("\n")
            );
        } catch (error) {
            await dumpDebugInfo(page, "audio-tools-sample");
            throw error;
        }
    });
    it("cancels preparation at the 16-million-sample limit and can open another file", async () => {
        const path = join(directory, "large.wav");
        const bytes = Buffer.alloc(44 + 16_000_000, 128);
        readFileSync(fixture).copy(bytes, 0, 0, 44);
        bytes.writeUInt32LE(bytes.length - 8, 4);
        bytes.writeUInt32LE(16000, 28);
        bytes.writeUInt16LE(1, 32);
        bytes.writeUInt16LE(8, 34);
        bytes.writeUInt32LE(16_000_000, 40);
        writeFileSync(path, bytes);
        await (await page.$(`${sample} input[type=file]`)).uploadFile(path);
        await page.waitForFunction(
            (selector) => {
                const section = document.querySelector(selector);
                return (
                    section?.textContent.includes("large.wav") &&
                    !section.querySelector('[aria-label="Loading audio"]')
                );
            },
            { timeout: 30000 },
            sample
        );
        await click(sample, "Trim");
        await click(sample, "Apply");
        await click(sample, "Cancel");
        assert.equal(await page.$(`${sample} [role=alert]`), null);
        assert.equal(
            await page.$eval(sample, (element) =>
                element.textContent.includes("large-trim.wav")
            ),
            false
        );
        await upload(sample);
        await page.waitForFunction(
            (selector) =>
                document
                    .querySelector(selector)
                    ?.textContent.includes("tone.wav"),
            {},
            sample
        );
    });
    it("plots all analyses and loads the bin inspector only when requested", async () => {
        try {
            await page.click('[data-testid="sidebar-bottom-audioAnalysis"]');
            await page.waitForSelector(`${analysis} input[type=file]`);
            await upload(analysis);
            assert.ok(wasm.every((url) => url.includes("scale")));
            await click(analysis, "Analyze");
            await result(analysis, "tone-spectrum.pvx");
            await page.waitForSelector(
                `${analysis} canvas[aria-label^="Spectral energy"]`
            );
            assert.ok(wasm.some((url) => url.includes("pvanal")));
            assert.ok(!wasm.some((url) => url.includes("pvlook")));
            await snapshot("analysis-dark");
            await page.click(`${analysis} summary`);
            await click(analysis, "Inspect");
            await page.waitForSelector(
                `${analysis} canvas[aria-label^="Frequency bins"]`
            );
            assert.ok(wasm.some((url) => url.includes("pvlook")));
            for (const [label, name] of [
                ["Partials", "tone-partials.ats"],
                ["Harmonics", "tone-harmonics.het"],
                ["Voice", "tone-lpc.lpc"],
                ["Envelope", "tone-envelope.txt"]
            ]) {
                await click(analysis, label);
                await click(analysis, "Analyze");
                await result(analysis, name);
                assert.ok(await page.$(`${analysis} figure canvas`));
            }
        } catch (error) {
            await dumpDebugInfo(page, "audio-tools-analysis");
            throw error;
        }
    });
    it("works in the light theme", async () => {
        await page.evaluate(() =>
            localStorage.setItem("theme", "github-light")
        );
        await page.reload({ waitUntil: "networkidle2" });
        await waitForProject(page);
        if (!(await page.$(`${analysis} input[type=file]`)))
            await page.click('[data-testid="sidebar-bottom-audioAnalysis"]');
        await page.waitForSelector(`${analysis} input[type=file]`);
        await upload(analysis);
        await click(analysis, "Analyze");
        await result(analysis, "tone-spectrum.pvx");
        await snapshot("analysis-light");
    });
    it("fits a narrow panel without horizontal overflow", async () => {
        await page.setViewport({ width: 390, height: 844 });
        await page.waitForSelector(
            'nav[aria-label="Editor views"] button[aria-label="Analysis"]'
        );
        await page.click(
            'nav[aria-label="Editor views"] button[aria-label="Analysis"]'
        );
        await page.waitForSelector(`${analysis} input[type=file]`);
        await upload(analysis);
        await click(analysis, "Analyze");
        await result(analysis, "tone-spectrum.pvx");
        const sizes = await page.$eval(analysis, (node) => ({
            width: node.clientWidth,
            scroll: node.scrollWidth
        }));
        assert.ok(sizes.scroll <= sizes.width + 1, JSON.stringify(sizes));
        await snapshot("analysis-mobile");
    });
});
