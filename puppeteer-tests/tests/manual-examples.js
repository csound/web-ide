import assert from "node:assert/strict";
import { test } from "node:test";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

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

for (const width of [1440, 390]) {
    test(
        `manual examples are editable, playable and disposable at ${width}px`,
        { skip: targetName !== "local", timeout: 120000 },
        async () => {
            const browser = await puppeteer.launch(BROWSER_SETTINGS);
            try {
                const page = await browser.newPage();
                if (process.env.MANUAL_EXAMPLE_THEME) {
                    await page.evaluateOnNewDocument(
                        (theme) => localStorage.setItem("theme", theme),
                        process.env.MANUAL_EXAMPLE_THEME
                    );
                }
                await page.setViewport({ width, height: 900 });
                const errors = [];
                const writes = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.setRequestInterception(true);
                page.on("request", (request) => {
                    const url = new URL(request.url());
                    if (mocks[url.pathname])
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
                    else {
                        if (url.pathname.includes("/Write/"))
                            writes.push(url.href);
                        void request.abort();
                    }
                });
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/manual-examples.html`
                );
                await page.waitForSelector(".cm-editor");
                const click = async (label) => {
                    const button = await page.$(
                        `::-p-aria(${label}[role="button"])`
                    );
                    assert.ok(button, label);
                    await button.click();
                };
                const openExample = async (opcode) => {
                    await page.evaluate(
                        (name) => window.manualExampleFixture.lookup(name),
                        opcode
                    );
                    if (width < 768) await click("Manual");
                    await page.waitForFunction(
                        (name) =>
                            [...document.querySelectorAll("iframe")].some(
                                (frame) =>
                                    frame.contentWindow.location.pathname ===
                                    `/manual/opcodes/${name}/`
                            ),
                        {},
                        opcode
                    );
                    const frame = page
                        .frames()
                        .find((frame) =>
                            frame.url().includes(`/manual/opcodes/${opcode}/`)
                        );
                    assert.ok(frame);
                    const button = await frame.waitForSelector(".open-example");
                    await button.click();
                    await page.waitForSelector(
                        '[aria-label$=", temporary file"] .cm-editor',
                        { visible: true }
                    );
                };
                await openExample("oscili");
                if (width >= 768)
                    assert.ok(
                        await page.$('[role="tab"][data-temporary="true"]')
                    );
                await page.evaluate(() => window.manualExampleFixture.edit());
                await click("Save fixture");
                await click("Save all fixture");
                const snapshot = await page.evaluate(() => {
                    const state = window.manualExampleFixture.state();
                    return {
                        documents:
                            state.ProjectsReducer.projects[
                                "manual-example-fixture"
                            ].documents,
                        layout: localStorage.getItem(
                            "manual-example-fixture:workspaceLayout"
                        )
                    };
                });
                assert.deepEqual(Object.keys(snapshot.documents), ["saved"]);
                assert.equal(
                    snapshot.documents.saved.currentValue,
                    "; Original project file"
                );
                assert.equal(snapshot.layout.includes("temporary edit"), false);
                assert.equal(snapshot.layout.includes("oscili.csd"), false);
                await click("Play manual example");
                await page.waitForFunction(
                    () =>
                        window.manualExampleFixture.state().csound.status ===
                        "playing"
                );
                if (process.env.MANUAL_EXAMPLE_SCREENSHOTS)
                    await page.screenshot({
                        path: `${process.env.MANUAL_EXAMPLE_SCREENSHOTS}-${width}.png`
                    });
                await click("Discard");
                await page.waitForFunction(
                    () =>
                        window.manualExampleFixture.state().csound.status ===
                        "stopped"
                );
                assert.equal(
                    await page.$('[aria-label$=", temporary file"]'),
                    null
                );
                assert.equal(
                    await page.evaluate(
                        () =>
                            window.manualExampleFixture.state().ModalReducer
                                .isOpen
                    ),
                    false
                );

                // Play the unlinked sample first so an earlier run cannot supply it.
                for (const opcode of ["lposcil3", "diskin2"]) {
                    await openExample(opcode);
                    if (opcode === "lposcil3") {
                        const linked = await page.evaluate(() => {
                            const dock =
                                window.manualExampleFixture.state()
                                    .ProjectEditorReducer.tabDock;
                            return dock.openDocuments[dock.tabIndex].temporary
                                .source.assets;
                        });
                        assert.deepEqual(linked, []);
                    }
                    await click("Play manual example");
                    await page.waitForFunction(
                        () =>
                            window.manualExampleFixture.state().csound
                                .status === "playing"
                    );
                    await click("Stop manual example");
                    await page.waitForFunction(
                        () =>
                            window.manualExampleFixture.state().csound
                                .status === "stopped"
                    );
                    if (opcode === "lposcil3") await click("Discard");
                }
                if (width >= 768) {
                    await click("Split editor right");
                    const focusButtons = await page.$$(
                        '::-p-aria(Toggle focus mode[role="button"])'
                    );
                    await focusButtons.at(-1).click();
                    await page.waitForFunction(() => {
                        const state =
                            window.manualExampleFixture.state()
                                .ProjectEditorReducer;
                        const layout = JSON.parse(
                            localStorage.getItem(
                                "manual-example-fixture:workspaceLayout"
                            )
                        );
                        return (
                            state.root.kind === "split" &&
                            state.maximizedPanelId === state.activePanelId &&
                            layout.root.kind === "panel" &&
                            layout.activePanelId === layout.root.id &&
                            layout.maximizedPanelId === null
                        );
                    });
                }
                await page.reload();
                await page.waitForSelector(".cm-editor");
                assert.equal(
                    await page.$('[aria-label$=", temporary file"]'),
                    null
                );
                const restored = await page.evaluate(
                    () =>
                        window.manualExampleFixture.state().ProjectEditorReducer
                );
                assert.equal(restored.root.kind, "panel");
                assert.deepEqual(
                    restored.root.tabs.map((tab) => tab.uid),
                    ["saved"]
                );
                assert.equal(restored.activePanelId, restored.root.id);
                assert.equal(restored.maximizedPanelId, null);
                assert.deepEqual(writes, []);
                assert.deepEqual(errors, []);
            } finally {
                await browser.close();
            }
        }
    );
}
