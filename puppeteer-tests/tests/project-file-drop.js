import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
        .join("\n"),
    // Unit tests cover the real uploader's Firestore/Storage writes and size checks.
    "/src/components/projects/upload-files.ts": `
        export const MAX_PROJECT_FILE_BYTES = 2000000;
        export const PROJECT_FILE_SIZE_LABEL = "2 MB";
        export const uploadProjectFiles = (projectUid, files) => async dispatch => {
            window.fileDropUploads = (window.fileDropUploads || []).concat(files.map(f => f.name));
            const documents = {};
            for (const file of files) {
                const value = await file.text();
                documents[file.name] = {documentUid:file.name,filename:file.name,type:file.name.endsWith(".csd")?"txt":"bin",path:[],currentValue:value,savedValue:value,isModifiedLocally:false,userUid:"fixture-author"};
            }
            dispatch({type:"PROJECTS.ADD_PROJECT_DOCUMENTS",projectUid,documents});
        };
    `
};

for (const theme of ["default", "github-light"]) {
    test(
        `window file drops reach the tree and leave the editor usable (${theme})`,
        { skip: targetName !== "local", timeout: 120000 },
        async () => {
            const directory = await mkdtemp(
                join(tmpdir(), "csound-file-drop-")
            );
            const files = [
                join(directory, "dropped.csd"),
                join(directory, "sample.wav")
            ];
            await Promise.all(
                files.map((path) => writeFile(path, "; uploaded fixture"))
            );
            const browser = await puppeteer.launch(BROWSER_SETTINGS);
            try {
                const page = await browser.newPage();
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.evaluateOnNewDocument(
                    (value) => localStorage.setItem("theme", value),
                    theme
                );
                await page.setViewport({ width: 1440, height: 900 });
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
                    else void request.abort();
                });
                await page.goto(
                    `${target.baseUrl}/puppeteer-tests/fixtures/project-file-drop.html`
                );
                await page.waitForSelector(".cm-editor");
                const session = await page.createCDPSession();
                const data = { items: [], files, dragOperationsMask: 1 };
                await session.send("Input.dispatchDragEvent", {
                    type: "dragEnter",
                    x: 700,
                    y: 20,
                    data
                });
                await page.waitForSelector(
                    '[role="status"][aria-label="File drop"]'
                );
                const bounds = await page.$eval(
                    '[role="status"][aria-label="File drop"]',
                    (element) => {
                        const rect = element.getBoundingClientRect();
                        return {
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height
                        };
                    }
                );
                assert.deepEqual(bounds, {
                    x: 0,
                    y: 0,
                    width: 1440,
                    height: 900
                });
                if (process.env.FILE_DROP_SCREENSHOTS)
                    await page.screenshot({
                        path: `/tmp/project-file-drop-${theme}.png`
                    });
                await session.send("Input.dispatchDragEvent", {
                    type: "dragOver",
                    x: 700,
                    y: 250,
                    data
                });
                await session.send("Input.dispatchDragEvent", {
                    type: "drop",
                    x: 700,
                    y: 250,
                    data
                });
                await page.waitForFunction(
                    () => window.fileDropUploads?.length === 2
                );
                await page.waitForFunction(() =>
                    Object.values(
                        window.fileDropFixture.state().ProjectsReducer.projects[
                            "file-drop-fixture"
                        ].documents
                    ).some((d) => d.filename === "sample.wav")
                );
                assert.equal(
                    await page.$('[role="status"][aria-label="File drop"]'),
                    null
                );
                const text = await page.$eval(
                    ".cm-content",
                    (element) => element.textContent
                );
                assert.equal(text, "; Original project file");
                assert.ok(
                    (
                        await page.$eval(
                            "body",
                            (element) => element.textContent
                        )
                    ).includes("dropped.csd")
                );
                await page.evaluate(() => window.fileDropFixture.manual());
                const frame = await page.waitForFrame((frame) =>
                    frame.url().includes("/manual/")
                );
                await frame.waitForSelector("body");
                await frame.evaluate(() => {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(new File(["manual"], "manual.csd"));
                    document.body.dispatchEvent(
                        new DragEvent("dragenter", {
                            bubbles: true,
                            dataTransfer
                        })
                    );
                });
                await page.waitForSelector(
                    '[role="status"][aria-label="File drop"]'
                );
                await frame.evaluate(() => {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(new File(["manual"], "manual.csd"));
                    document.body.dispatchEvent(
                        new DragEvent("drop", {
                            bubbles: true,
                            cancelable: true,
                            dataTransfer
                        })
                    );
                });
                await page.waitForFunction(() =>
                    window.fileDropUploads?.includes("manual.csd")
                );
                assert.equal(
                    await page.$('[role="status"][aria-label="File drop"]'),
                    null
                );
                await page.waitForFunction(
                    () =>
                        window.fileDropFixture.state().ProjectsReducer.projects[
                            "file-drop-fixture"
                        ].documents["manual.csd"]
                );
                await page.setViewport({ width: 390, height: 844 });
                await session.send("Input.dispatchDragEvent", {
                    type: "dragEnter",
                    x: 195,
                    y: 20,
                    data
                });
                await page.waitForSelector(
                    '[role="status"][aria-label="File drop"]'
                );
                const narrowBounds = await page.$eval(
                    '[role="status"][aria-label="File drop"]',
                    (element) => {
                        const panel =
                            element.firstElementChild.getBoundingClientRect();
                        return {
                            fits: panel.left >= 0 && panel.right <= innerWidth,
                            width: element.getBoundingClientRect().width
                        };
                    }
                );
                assert.deepEqual(narrowBounds, { fits: true, width: 390 });
                if (process.env.FILE_DROP_SCREENSHOTS)
                    await page.screenshot({
                        path: `/tmp/project-file-drop-${theme}-mobile.png`
                    });
                await page.keyboard.press("Escape");
                await page.waitForFunction(
                    () =>
                        !document.querySelector(
                            '[role="status"][aria-label="File drop"]'
                        )
                );
                assert.deepEqual(errors, []);
            } finally {
                await browser.close();
                await rm(directory, { recursive: true, force: true });
            }
        }
    );
}
