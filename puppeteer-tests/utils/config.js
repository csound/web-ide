import { existsSync, readFileSync } from "node:fs";

const localBaseUrl = process.env.LOCAL_BASE_URL || "http://localhost:3000";

/**
 * Target environment configurations.
 * Each entry maps a target name to its base URL and a project editor URL
 * used by the editor test suite.
 * @type {Record<string, {baseUrl: string, projectUrl: string}>}
 */
const TARGETS = {
    local: {
        baseUrl: localBaseUrl,
        projectUrl: `${localBaseUrl}/editor/ElPGLLOOc5qWNM4VmfVV`
    },
    dev: {
        baseUrl: "https://csound-ide-dev.web.app",
        projectUrl: "https://csound-ide-dev.web.app/editor/ElPGLLOOc5qWNM4VmfVV"
    },
    prod: {
        baseUrl: "https://ide.csound.com",
        projectUrl: "https://ide.csound.com/editor/oRl3K1TaYnICnAxv7bUg"
    }
};

const name = process.env.TARGET || "prod";
const target = TARGETS[name];

if (!target) {
    const valid = Object.keys(TARGETS).join(", ");
    throw new Error(`Unknown TARGET="${name}". Valid targets: ${valid}`);
}

export const TIMEOUT = {
    NAVIGATION: 60000,
    EDITOR: 60000,
    CONSOLE_OUTPUT: 30000
}; // ms

const chromePathFile = new URL("../.chrome-path", import.meta.url);
const installedChromePath = existsSync(chromePathFile)
    ? readFileSync(chromePathFile, "utf8").trim()
    : "";
const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    (installedChromePath && existsSync(installedChromePath)
        ? installedChromePath
        : undefined);

export const BROWSER_SETTINGS = {
    headless: process.env.HEADLESS !== "false",
    executablePath,
    // Connect directly instead of waiting for Chrome to print a WebSocket URL.
    pipe: true,
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--autoplay-policy=no-user-gesture-required"
    ],
    viewport: { width: 1280, height: 900 }
};

export { target, name as targetName };
