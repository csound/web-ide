/**
 * Target environment configurations.
 * Each entry maps a target name to its base URL and a project editor URL
 * used by the editor test suite.
 * @type {Record<string, {baseUrl: string, projectUrl: string}>}
 */
const TARGETS = {
    local: {
        baseUrl: "http://localhost:3000",
        projectUrl: "http://localhost:3000/editor/FHIOJxCAB2lugoJ3iwBd"
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

export const BROWSER_SETTINGS = {
    headless: process.env.HEADLESS !== "false",
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
