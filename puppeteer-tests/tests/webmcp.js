import { strict as assert } from "node:assert";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target } from "../utils/config.js";

const source = (duration) => `<CsoundSynthesizer>
<CsOptions>
-odac
</CsOptions>
<CsInstruments>
sr = 48000
ksmps = 32
nchnls = 2
0dbfs = 1
instr 1
 a1 oscili 0.05, 440
 outs a1, a1
endin
</CsInstruments>
<CsScore>
i 1 0 ${duration}
e
</CsScore>
</CsoundSynthesizer>`;

test(
    "native WebMCP editor and audio workflow",
    { skip: process.env.RUN_WEBMCP !== "1", timeout: 180000 },
    async () => {
        const browser = await puppeteer.launch({
            ...BROWSER_SETTINGS,
            args: [
                ...BROWSER_SETTINGS.args,
                "--enable-experimental-web-platform-features",
                "--enable-features=WebMCP"
            ]
        });
        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1440, height: 1000 });
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            const projectUrl = process.env.WEBMCP_TEST_URL ?? target.projectUrl;
            await page.goto(projectUrl, {
                waitUntil: "domcontentloaded"
            });
            await page.waitForFunction(
                () =>
                    document.querySelector('[data-testid="webmcp-status"]')
                        ?.textContent === "WebMCP ready",
                { timeout: 60000 }
            );
            const objectInput =
                Number((await browser.version()).split("/")[1].split(".")[0]) >=
                155;
            const call = async (name, input = {}) => {
                console.log(`Calling ${name}`);
                const result = await page.evaluate(
                    async ({ name, input, objectInput }) => {
                        const context = document.modelContext;
                        const tool = (await context.getTools()).find(
                            (tool) => tool.name === `csound_${name}`
                        );
                        if (!tool) throw new Error(`Missing tool: ${name}`);
                        const result = await context.executeTool(
                            tool,
                            objectInput ? input : JSON.stringify(input)
                        );
                        return typeof result === "string"
                            ? JSON.parse(result)
                            : result;
                    },
                    { name, input, objectInput }
                );
                console.log(
                    `${name}: ${result.ok ? "ok" : result.error?.code}`
                );
                return result;
            };
            const workspace = await call("read_workspace");
            assert.equal(workspace.ok, true);
            assert.equal(workspace.project.can_save, false);
            assert.equal((await call("read_guide")).tools.length, 16);
            const file = workspace.files.find((file) =>
                file.path.endsWith(".csd")
            );
            assert.ok(file);
            const document_id = file.document_id;
            assert.equal(
                (await call("open_document", { document_id })).ok,
                true
            );
            let current = await call("read_document", { document_id });
            assert.equal(
                (
                    await call("save_document", {
                        document_id,
                        base_revision: current.revision
                    })
                ).error.code,
                "permission_denied"
            );
            const setSource = async (text) => {
                current = await call("read_document", { document_id });
                const updated = await call("update_document", {
                    document_id,
                    base_revision: current.revision,
                    source: text
                });
                assert.equal(updated.ok, true, JSON.stringify(updated));
                return updated;
            };
            const updated = await setSource(source(60));
            assert.equal(
                (
                    await call("update_document", {
                        document_id,
                        base_revision: current.revision,
                        source: "stale"
                    })
                ).error.code,
                "stale_revision"
            );
            assert.equal(
                (
                    await call("replace_text", {
                        document_id,
                        base_revision: updated.revision,
                        old_text: "0.05, 440",
                        new_text: "0.05, 220"
                    })
                ).ok,
                true
            );
            await page.waitForFunction(() =>
                [...document.querySelectorAll(".cm-content")].some((node) =>
                    node.textContent.includes("0.05, 220")
                )
            );
            const tabs = await call("read_workspace");
            const panel = tabs.panels.find((panel) =>
                panel.tabs.some((tab) => tab.document_id === document_id)
            );
            const tab_id = panel.tabs.find(
                (tab) => tab.document_id === document_id
            ).tab_id;
            assert.equal(
                (await call("select_tab", { panel_id: panel.panel_id, tab_id }))
                    .ok,
                true
            );
            assert.equal(
                (await call("close_tab", { panel_id: panel.panel_id, tab_id }))
                    .error.code,
                "unsaved_changes"
            );
            if (workspace.targets.length) {
                assert.equal(
                    (
                        await call("select_target", {
                            target_name: workspace.targets[0].targetName
                        })
                    ).ok,
                    true
                );
            }
            const playing = await call("play", { document_id });
            assert.equal(playing.ok, true, JSON.stringify(playing));
            assert.equal((await call("pause")).status, "paused");
            assert.equal((await call("resume")).status, "playing");
            assert.equal((await call("stop")).status, "stopped");
            await setSource(source(0.2));
            const rendered = await call("render", { document_id });
            assert.equal(rendered.ok, true, JSON.stringify(rendered));
            assert.equal(rendered.status, "completed");
            assert.ok(rendered.files.some((name) => name.endsWith(".wav")));
            const renderedWorkspace = await call("read_workspace");
            assert.ok(
                renderedWorkspace.rendered_files.some(
                    (file) => file.bytes > 1000
                )
            );
            // Read the audio preview to verify the file shown to the user.
            await page.evaluate((name) => {
                const label = [
                    ...document.querySelectorAll('[data-testid="file-tree"] p')
                ].find((node) => node.textContent === name);
                if (!label)
                    throw new Error(
                        `Rendered file missing from the tree: ${name}`
                    );
                label.click();
            }, rendered.files[0]);
            await page.waitForSelector('audio source[src^="blob:"]');
            const header = await page.$eval(
                'audio source[src^="blob:"]',
                async (node) => {
                    const bytes = await (await fetch(node.src)).arrayBuffer();
                    return Array.from(new Uint8Array(bytes).slice(0, 12));
                }
            );
            assert.equal(String.fromCharCode(...header.slice(0, 4)), "RIFF");
            assert.equal(String.fromCharCode(...header.slice(8, 12)), "WAVE");
            await setSource(
                source(0.2).replace("a1 oscili", "a1 not_an_opcode")
            );
            assert.equal((await call("render", { document_id })).ok, false);
            assert.match((await call("read_console")).text, /error|syntax/i);
            await setSource(source(86400));
            const renderPromise = call("render", { document_id });
            await page.waitForFunction(
                async (objectInput) => {
                    const context = document.modelContext;
                    const tool = (await context.getTools()).find(
                        (tool) => tool.name === "csound_read_workspace"
                    );
                    const result = await context.executeTool(
                        tool,
                        objectInput ? {} : "{}"
                    );
                    return (
                        (typeof result === "string"
                            ? JSON.parse(result)
                            : result
                        ).audio.status === "rendering"
                    );
                },
                { polling: 100 },
                objectInput
            );
            assert.equal((await call("stop")).status, "stopped");
            assert.equal((await renderPromise).error.code, "cancelled");
            assert.equal(
                (await call("read_workspace")).rendered_files.length,
                renderedWorkspace.rendered_files.length
            );
            const link = await page.$eval(
                '[data-testid="webmcp-status"]',
                (node) => node.getAttribute("href")
            );
            assert.equal(link, "/documentation#webmcp");
            const docs = await browser.newPage();
            await docs.goto(new URL(link, projectUrl).href, {
                waitUntil: "domcontentloaded"
            });
            await docs.waitForSelector("#webmcp table");
            assert.equal(
                await docs.$$eval("#webmcp tbody tr", (rows) => rows.length),
                16
            );
            await page.bringToFront();
            await page.screenshot({ path: "/tmp/csound-webmcp-editor.png" });
            await page.setViewport({ width: 390, height: 844 });
            await page.waitForFunction(() => {
                const box = document
                    .querySelector('[data-testid="webmcp-status"]')
                    .getBoundingClientRect();
                return (
                    box.width > 0 &&
                    box.left >= 0 &&
                    box.right <= window.innerWidth
                );
            });
            const badge = await page.$eval(
                '[data-testid="webmcp-status"]',
                (node) => {
                    const box = node.getBoundingClientRect();
                    return {
                        left: box.left,
                        right: box.right,
                        visible: box.width > 0
                    };
                }
            );
            assert.equal(badge.visible, true);
            assert.ok(badge.left >= 0 && badge.right <= 390);
            await page.screenshot({ path: "/tmp/csound-webmcp-mobile.png" });
            // Client navigation must remove tools even if project data stays cached.
            await page.evaluate(() => {
                window.history.pushState({}, "", "/documentation");
                window.dispatchEvent(new PopStateEvent("popstate"));
            });
            await page
                .waitForFunction(
                    async () =>
                        (await document.modelContext.getTools()).length === 0
                )
                .catch(async (error) => {
                    console.log(
                        await page.evaluate(async () => {
                            return {
                                path: location.pathname,
                                tools: (
                                    await document.modelContext.getTools()
                                ).map((t) => t.name),
                                text: document.body.innerText.slice(0, 180)
                            };
                        })
                    );
                    throw error;
                });
            assert.deepEqual(errors, []);
        } finally {
            await browser.close();
        }
    }
);
