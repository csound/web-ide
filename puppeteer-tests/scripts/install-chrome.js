import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { Browser, Cache, detectBrowserPlatform } from "@puppeteer/browsers";
import puppeteer from "puppeteer";

const browser = Browser.CHROME;
const buildId = puppeteer.defaultBrowserRevision;
const cacheDir = puppeteer.configuration.cacheDirectory;
const platform = detectBrowserPlatform();

if (!platform) {
    throw new Error("Unable to detect a Puppeteer browser platform.");
}

const cache = new Cache(cacheDir);
const installDir = cache.installationDir(browser, platform, buildId);
const executablePath = cache.computeExecutablePath({
    browser,
    buildId,
    platform
});

if (existsSync(installDir) && !existsSync(executablePath)) {
    console.warn(
        `Removing incomplete ${browser}@${buildId} install from ${installDir}`
    );
    cache.uninstall(browser, platform, buildId);
}

const result = spawnSync("puppeteer", ["browsers", "install", browser], {
    stdio: "inherit",
    shell: process.platform === "win32"
});

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}

if (!existsSync(executablePath)) {
    console.error(
        `Installed ${browser}@${buildId}, but ${executablePath} is missing`
    );
    process.exit(1);
}

writeFileSync(".chrome-path", `${executablePath}\n`);
