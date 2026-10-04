import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer";
import { BROWSER_SETTINGS, target, targetName } from "../utils/config.js";

// Fictional profiles, independent of live accounts or database contents.
const users = [
    {
        userUid: "ines",
        username: "ines-valdes",
        displayName: "Inés Valdés",
        bio: "Field recordings, granular synthesis and the sounds between stations.",
        links: ["https://ines.example/music"],
        photoUrl: ""
    },
    {
        userUid: "marta",
        username: "marta-nowak",
        displayName: "Marta Nowak",
        bio: "Bowed strings and slow electronic music. Building instruments with Csound.",
        links: [],
        photoUrl: ""
    },
    {
        userUid: "tariq",
        username: "tariq-haddad",
        displayName: "Tariq Haddad",
        bio: "Live coding, sampled percussion and small experiments in rhythm.",
        links: ["https://tariq.example"],
        photoUrl: ""
    },
    {
        userUid: "eirik",
        username: "eirik-solberg",
        displayName: "Eirik Solberg",
        bio: "Physical models and feedback systems for performance.",
        links: [],
        photoUrl: ""
    }
];
const mocks = {
    "/src/components/home/user-search-api.ts": `
        window.userSearchFixture = { requests: [], mode: "success" };
        export async function searchUsers(query, offset) {
            const mode = window.userSearchFixture.mode;
            window.userSearchFixture.requests.push({query, offset});
            await new Promise(resolve => setTimeout(resolve, 250));
            if (mode === "error") throw {code:"functions/resource-exhausted"};
            return {data:mode === "empty" ? [] : ${JSON.stringify(users)}, nextOffset: offset === 0 ? 8 : null};
        }
    `,
    "/src/components/home/actions.ts": `
        export const fetchPopularArtists = () => dispatch => dispatch({type:"HOME.SET_POPULAR_ARTISTS_LOADING",isLoading:false});
        export const fetchPopularProjects = () => dispatch => dispatch({type:"HOME.SET_POPULAR_PROJECTS_LOADING",isLoading:false});
        export const fetchRandomProjects = () => dispatch => dispatch({type:"HOME.SET_RANDOM_PROJECTS_LOADING",isLoading:false});
        export const searchProjects = (query, offset) => dispatch => {
            dispatch({type:"HOME.SEARCH_PROJECTS_REQUEST",query,offset});
            dispatch({type:"HOME.SEARCH_PROJECTS_SUCCESS",result:[],totalRecords:0});
        };
    `
};

for (const [theme, width] of [
    ["default", 1440],
    ["github-light", 1440],
    ["default", 390],
    ["github-light", 320]
]) {
    test(
        `user search in ${theme} at ${width}px`,
        { skip: targetName !== "local", timeout: 60000 },
        async () => {
            const browser = await puppeteer.launch(BROWSER_SETTINGS);
            try {
                const page = await browser.newPage();
                page.setDefaultTimeout(10000);
                const errors = [];
                page.on("pageerror", (error) => errors.push(error.message));
                await page.setViewport({ width, height: 1000 });
                await page.evaluateOnNewDocument(
                    (value) => localStorage.setItem("theme", value),
                    theme
                );
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
                    `${target.baseUrl}/puppeteer-tests/fixtures/user-search.html`
                );
                await page.locator('button[value="users"]').click();
                await page.locator('input[type="search"]').fill("granular");
                await page.waitForSelector(
                    'ul[aria-label="User results"][aria-busy="true"]'
                );
                await page.waitForSelector('a[href="/profile/ines-valdes"]');
                await page.focus('a[href="/profile/ines-valdes"]');
                assert.equal(
                    await page.$eval(
                        'a[href="/profile/ines-valdes"]',
                        (element) => getComputedStyle(element).outlineStyle
                    ),
                    "solid"
                );
                assert.equal(
                    (await page.$$('ul[aria-label="User results"] a')).length,
                    4
                );
                assert.equal(
                    await page.evaluate(
                        () => document.documentElement.scrollWidth > innerWidth
                    ),
                    false
                );
                await mkdir("screenshots", { recursive: true });
                await page.screenshot({
                    path: `screenshots/user-search-${theme}-${width}.png`
                });
                await page.locator('button[aria-label="Next users"]').click();
                await page.waitForFunction(
                    () => window.userSearchFixture.requests.at(-1)?.offset === 8
                );
                await page.waitForSelector(
                    'button[aria-label="Next users"][disabled]'
                );
                await page
                    .locator('button[aria-label="Previous users"]')
                    .click();
                await page.waitForFunction(
                    () => window.userSearchFixture.requests.at(-1)?.offset === 0
                );
                await page.waitForSelector('a[href="/profile/ines-valdes"]');
                await page.evaluate(() => {
                    window.userSearchFixture.mode = "error";
                });
                await page
                    .locator('input[type="search"]')
                    .fill("field recordings");
                await page.waitForSelector('[role="alert"]');
                await page.evaluate(() => {
                    window.userSearchFixture.mode = "empty";
                });
                await page.locator("::-p-text(Retry)").click();
                await page.waitForSelector("::-p-text(No users found)");
                await page.$eval('input[type="search"]', (input) =>
                    input.select()
                );
                await page.keyboard.press("Backspace");
                await page.waitForFunction(() =>
                    document.body.textContent.includes("Type at least two")
                );
                await page.locator('button[value="projects"]').click();
                assert.equal(
                    await page.$eval(
                        'input[type="search"]',
                        (input) => input.value
                    ),
                    ""
                );
                assert.deepEqual(errors, []);
            } finally {
                await browser.close();
            }
        }
    );
}
