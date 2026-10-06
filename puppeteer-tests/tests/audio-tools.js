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
    /** Change a native input through the same event React observes. */
    async function setInput(selector, value) {
        await page.$eval(
            selector,
            (input, next) => {
                Object.getOwnPropertyDescriptor(
                    HTMLInputElement.prototype,
                    "value"
                ).set.call(input, next);
                input.dispatchEvent(new Event("input", { bubbles: true }));
            },
            value
        );
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
        await page
            .waitForFunction(
                (selector, name) =>
                    Array.from(
                        document.querySelectorAll(`${selector} [role=status]`)
                    ).some((node) => node.textContent === name),
                { timeout: 30000 },
                section,
                filename
            )
            .catch(async (error) => {
                await dumpDebugInfo(page, `audio-tools-${filename}`);
                throw error;
            });
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
        const dismiss = await page.$('[aria-label="Dismiss project info"]');
        if (dismiss) await dismiss.click();
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
    it("loads without WASM, then updates a single preview automatically", async () => {
        await page.click('[data-testid="sidebar-bottom-sampleEditor"]');
        await page.waitForSelector(`${sample} input[type=file]`);
        assert.equal(wasm.length, 0);
        await upload(sample);
        assert.equal(wasm.length, 0);
        assert.equal(
            await page.$$eval(`${sample} button`, (nodes) =>
                nodes.some((node) =>
                    ["Apply", "Analyze", "Discard result"].includes(
                        node.textContent.trim()
                    )
                )
            ),
            false
        );
        await setInput(`${sample} input[aria-label="Selection start"]`, "0.5");
        await result(sample, "tone-trim.wav");
        assert.equal(wasm.length, 0);
        assert.equal((await page.$$(`${sample} audio`)).length, 1);
        await page.waitForFunction(
            (selector) =>
                Math.abs(
                    document.querySelector(`${selector} audio`).duration - 1.5
                ) < 0.001,
            {},
            sample
        );
        await click(sample, "Add to project");
        await page.waitForFunction(
            (selector) =>
                document
                    .querySelector(selector)
                    .textContent.includes("Added tone-trim.wav"),
            {},
            sample
        );
        const documentId = await page.evaluate(() => performance.timeOrigin);
        await click(sample, "Gain");
        await result(sample, "tone-edited.wav");
        assert.equal(
            await page.evaluate(() => performance.timeOrigin),
            documentId,
            "Starting the first audio worker must not reload the editor"
        );
        assert.ok(wasm.some((url) => url.includes("scale")));
        assert.ok(wasm.every((url) => url.includes("scale")));
        await snapshot("sample-changes-dark");
    });
    it("plays, seeks, and changes volume on the single waveform", async () => {
        assert.equal(await page.$(`${sample} audio[controls]`), null);
        await page.locator(`${sample} [aria-label="Play preview"]`).click();
        await page.waitForFunction(
            (selector) => {
                const media = document.querySelector(`${selector} audio`);
                const head = document.querySelector(
                    `${selector} [data-testid="preview-playhead"]`
                );
                return (
                    media.currentTime > 0.1 && parseFloat(head.style.left) > 0
                );
            },
            {},
            sample
        );
        await page.locator(`${sample} [aria-label="Pause preview"]`).click();
        await page.focus(`${sample} [aria-label="Preview playback position"]`);
        await page.keyboard.press("Home");
        await page.keyboard.press("ArrowRight");
        assert.equal(
            await page.$eval(`${sample} audio`, (node) => node.currentTime),
            1
        );
        await setInput(`${sample} [aria-label="Preview volume"]`, "0.25");
        assert.equal(
            await page.$eval(`${sample} audio`, (node) => node.volume),
            0.25
        );
        await page.locator(`${sample} [aria-label="Mute preview"]`).click();
        assert.equal(
            await page.$eval(`${sample} audio`, (node) => node.muted),
            true
        );
        await page.locator(`${sample} [aria-label="Unmute preview"]`).click();
        const canvas = await page.$(
            `${sample} [aria-label="Preview player"] canvas`
        );
        const width = await canvas.evaluate(
            (node) => node.getBoundingClientRect().width
        );
        await canvas.asLocator().click({ offset: { x: width / 2, y: 20 } });
        const time = await page.$eval(
            `${sample} audio`,
            (node) => node.currentTime
        );
        assert.ok(Math.abs(time - 0.75) < 0.02, `Sought to ${time}`);
        const offset = await page.$eval(`${sample} select`, (node) => {
            const select = node.getBoundingClientRect(),
                arrow = node.parentElement
                    .querySelector("svg")
                    .getBoundingClientRect();
            return Math.abs(
                select.y + select.height / 2 - arrow.y - arrow.height / 2
            );
        });
        assert.ok(offset < 1);
        await page.$eval(sample, (node) => (node.scrollTop = 0));
        await snapshot("sample-top-dark");
    });
    it("debounces rapid settings, removes edits, and clears back to the loaded file", async () => {
        await page
            .locator(`${sample} [aria-label="Reset gain to default"]`)
            .click();
        await result(sample, "tone-trim.wav");
        await click(sample, "Trim");
        await setInput(`${sample} input[aria-label="Selection start"]`, "0.6");
        await setInput(`${sample} input[aria-label="Selection start"]`, "0.7");
        await setInput(`${sample} input[aria-label="Selection start"]`, "0.75");
        assert.ok(await page.$(`${sample} [role=progressbar]`));
        assert.ok(
            await page.$$eval(`${sample} button`, (nodes) =>
                nodes.some(
                    (node) =>
                        node.textContent.trim() === "Download" && node.disabled
                )
            )
        );
        await page.waitForFunction(
            (selector) =>
                !document.querySelector(`${selector} [role=progressbar]`) &&
                Math.abs(
                    document.querySelector(`${selector} audio`).duration - 1.25
                ) < 0.001,
            {},
            sample
        );
        assert.match(
            await page.$eval(
                `${sample} [aria-label="Changes"]`,
                (node) => node.textContent
            ),
            /0.75 s/
        );
        await click(sample, "Clear all changes");
        await page.waitForFunction(
            (selector) =>
                Math.abs(
                    document.querySelector(`${selector} audio`).duration - 2
                ) < 0.001,
            {},
            sample
        );
        assert.equal(
            (await page.$$(`${sample} [aria-label="Changes"] li`)).length,
            0
        );
        assert.equal((await page.$$(`${sample} audio`)).length, 1);
        assert.equal(
            await page.$eval(`${sample} audio`, (node) => node.volume),
            0.25
        );
    });
    it("cancels automatic preparation at the 16-million-sample limit", async () => {
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
            (selector) =>
                document
                    .querySelector(selector)
                    ?.textContent.includes("large.wav") &&
                !document.querySelector(
                    `${selector} [aria-label="Loading audio"]`
                ),
            { timeout: 30000 },
            sample
        );
        await click(sample, "Trim");
        await page.waitForFunction(
            (selector) =>
                document
                    .querySelector(selector)
                    ?.textContent.includes("Applying trim"),
            {},
            sample
        );
        await click(sample, "Clear all changes");
        assert.equal(await page.$(`${sample} [role=alert]`), null);
        assert.equal(
            await page.$eval(sample, (node) =>
                node.textContent.includes("large-trim.wav")
            ),
            false
        );
        await upload(sample);
        await result(sample, "tone.wav");
    });
    it("plots all analyses and loads the bin inspector only when requested", async () => {
        try {
            await page.click('[data-testid="sidebar-bottom-audioAnalysis"]');
            await page.waitForSelector(`${analysis} input[type=file]`);
            await upload(analysis);
            assert.ok(wasm.every((url) => url.includes("scale")));
            await result(analysis, "tone-spectrum.pvx");
            await page.waitForSelector(
                `${analysis} canvas[aria-label^="Spectral energy"]`
            );
            assert.ok(wasm.some((url) => url.includes("pvanal")));
            assert.ok(!wasm.some((url) => url.includes("pvlook")));
            await snapshot("analysis-dark");
            await page.click(`${analysis} summary`);
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
                await result(analysis, name);
                assert.ok(await page.$(`${analysis} figure canvas`));
            }
            await click(analysis, "Clear all changes");
            await result(analysis, "tone.wav");
            assert.equal(await page.$(`${analysis} figure`), null);
            assert.equal(
                (await page.$$(`${analysis} [aria-label="Changes"] li`)).length,
                0
            );
            assert.equal((await page.$$(`${analysis} audio`)).length, 1);
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
        const dismiss = await page.$('[aria-label="Dismiss project info"]');
        if (dismiss) await dismiss.click();
        if (!(await page.$(`${analysis} input[type=file]`)))
            await page.click('[data-testid="sidebar-bottom-audioAnalysis"]');
        await page.waitForSelector(`${analysis} input[type=file]`);
        await upload(analysis);
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
        await result(analysis, "tone-spectrum.pvx");
        const sizes = await page.$eval(analysis, (node) => ({
            width: node.clientWidth,
            scroll: node.scrollWidth
        }));
        assert.ok(sizes.scroll <= sizes.width + 1, JSON.stringify(sizes));
        await snapshot("analysis-mobile");
        await click("", "Samples");
        await page.waitForSelector(`${sample} input[type=file]`);
        await upload(sample);
        await click(sample, "Gain");
        await result(sample, "tone-gain.wav");
        assert.ok(
            await page.$eval(
                sample,
                (node) => node.scrollWidth <= node.clientWidth + 1
            )
        );
        await page.$eval(sample, (node) => (node.scrollTop = 0));
        await snapshot("sample-mobile");
    });
});
