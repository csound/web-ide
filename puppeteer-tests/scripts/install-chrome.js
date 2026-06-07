import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

const pathCandidatesByPlatform = {
    linux: [
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser"
    ],
    darwin: [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium"
    ],
    win32: [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
    ]
};

const commandCandidatesByPlatform = {
    linux: [
        "google-chrome",
        "google-chrome-stable",
        "chromium",
        "chromium-browser"
    ],
    darwin: ["google-chrome", "chromium"],
    win32: ["chrome.exe"]
};

function resolveCommand(command) {
    const resolver = process.platform === "win32" ? "where" : "which";
    const result = spawnSync(resolver, [command], { encoding: "utf8" });

    if (result.status !== 0) {
        return "";
    }

    return result.stdout.trim().split(/\r?\n/)[0] || "";
}

function chromeVersion(chromePath) {
    const result = spawnSync(chromePath, ["--version"], { encoding: "utf8" });

    if (result.status !== 0) {
        return "";
    }

    return result.stdout.trim();
}

const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    ...(pathCandidatesByPlatform[process.platform] || []),
    ...(commandCandidatesByPlatform[process.platform] || []).map(resolveCommand)
].filter(Boolean);

const chromePath = candidates.find((candidate) => {
    return existsSync(candidate) && chromeVersion(candidate);
});

if (!chromePath) {
    console.error(
        `Could not find a usable Chrome executable. Checked: ${candidates.join(", ")}`
    );
    process.exit(1);
}

writeFileSync(".chrome-path", `${chromePath}\n`);
console.log(`Using Chrome at ${chromePath}`);
console.log(chromeVersion(chromePath));
