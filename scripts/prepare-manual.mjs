import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
    existsSync,
    lstatSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    realpathSync,
    renameSync,
    rmSync,
    writeFileSync
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Hash file bytes without depending on the host's text encoding. */
const hash = (file) =>
    createHash("sha256").update(readFileSync(file)).digest("hex");

/** Keep output manifest entries inside the generated site. */
const safePath = (name) =>
    typeof name === "string" &&
    name.length > 0 &&
    !path.posix.isAbsolute(name) &&
    !/^[A-Za-z]:/.test(name) &&
    !name.includes("\\") &&
    !name.includes("\0") &&
    !name.split("/").includes("..");

/** Record the source commit, theme, tools, and npm runtime used by the build. */
export function getBuildInputs(root) {
    const source = path.join(root, "csound-manual");
    if (!existsSync(path.join(source, ".git")))
        throw new Error(
            "Initialize the manual with: git submodule update --init --recursive"
        );
    const git = (...args) =>
        execFileSync("git", ["-C", source, ...args], {
            encoding: "utf8"
        }).trim();
    if (
        realpathSync(git("rev-parse", "--show-toplevel")) !==
        realpathSync(source)
    )
        throw new Error("csound-manual must be a Git submodule checkout");
    if (git("diff", "HEAD", "--name-only"))
        throw new Error(
            "Commit or restore changes in csound-manual before building."
        );
    const inputs = { sourceCommit: git("rev-parse", "HEAD") };
    const collect = (directory) => {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            if ([".venv", "__pycache__", ".DS_Store"].includes(entry.name))
                continue;
            const file = path.join(directory, entry.name);
            if (entry.isDirectory()) collect(file);
            else if (entry.isFile())
                inputs[path.relative(root, file).split(path.sep).join("/")] =
                    hash(file);
        }
    };
    collect(path.join(root, "manual"));
    collect(path.join(root, "src/manual"));
    for (const file of [
        "scripts/prepare-manual.mjs",
        "scripts/build-manual-theme.mjs",
        "scripts/browser-targets.mjs",
        "package-lock.json",
        "src/styles/manual-page-theme.ts",
        "src/styles/manual-theme.ts",
        "src/styles/themes.ts",
        "src/components/editor/csound-highlighting.ts",
        ...readdirSync(path.join(root, "src/styles"))
            .filter(
                (name) => name.startsWith("_theme-") && name.endsWith(".ts")
            )
            .map((name) => `src/styles/${name}`),
        "node_modules/mathjax/package.json",
        "node_modules/mathjax/es5/tex-svg-full.js",
        "node_modules/mathjax/es5/a11y/assistive-mml.js",
        "node_modules/mathjax/LICENSE"
    ])
        inputs[file] = hash(path.join(root, file));
    return Object.fromEntries(
        Object.entries(inputs).sort(([a], [b]) => a.localeCompare(b))
    );
}

/** Check every expected file so a damaged cache gets rebuilt. */
function matchesOutput(directory, outputs) {
    return (
        outputs &&
        typeof outputs === "object" &&
        !Array.isArray(outputs) &&
        Object.keys(outputs).length > 0 &&
        Object.entries(outputs).every(([file, checksum]) => {
            const target = path.join(directory, file);
            return (
                safePath(file) &&
                existsSync(target) &&
                lstatSync(target).isFile() &&
                hash(target) === checksum
            );
        })
    );
}

/** A missing or damaged generated manifest requires a fresh build. */
function readManifest(directory) {
    try {
        return JSON.parse(
            readFileSync(path.join(directory, ".build.json"), "utf8")
        );
    } catch (error) {
        if (error.code === "ENOENT" || error instanceof SyntaxError)
            return undefined;
        throw error;
    }
}

/** Install pinned build tools once, then render from the submodule. */
function renderManual(root, output) {
    const environment = path.join(root, "manual/.venv");
    const python = path.join(
        environment,
        process.platform === "win32" ? "Scripts/python.exe" : "bin/python"
    );
    if (!existsSync(python))
        execFileSync(
            process.env.PYTHON ||
                (process.platform === "win32" ? "python" : "python3"),
            ["-m", "venv", environment],
            { stdio: "inherit" }
        );
    const requirements = path.join(root, "manual/requirements.txt");
    const stamp = path.join(environment, ".requirements-sha");
    const checksum = hash(requirements);
    if (!existsSync(stamp) || readFileSync(stamp, "utf8") !== checksum) {
        execFileSync(python, ["-m", "pip", "install", "-r", requirements], {
            stdio: "inherit"
        });
        writeFileSync(stamp, checksum, "utf8");
    }
    execFileSync(
        python,
        [path.join(root, "manual/build.py"), "--output", output],
        { stdio: "inherit", env: { ...process.env, PYTHONUTF8: "1" } }
    );
}

/** Publish a complete build under a lock, keeping the old copy on failure. */
export function prepareManualOutput(root, readInputs, render) {
    const output = path.join(root, "public/manual");
    const lock = path.join(root, ".manual-prepare.lock");
    try {
        mkdirSync(lock);
    } catch (error) {
        if (error.code === "EEXIST")
            throw new Error(
                `Manual preparation is already locked. If no preparation is running, remove ${lock} and retry.`
            );
        throw error;
    }
    let temporary;
    try {
        const inputs = readInputs();
        const cached = readManifest(output);
        if (
            JSON.stringify(cached?.inputs) === JSON.stringify(inputs) &&
            matchesOutput(output, cached.outputs)
        )
            return;
        temporary = mkdtempSync(path.join(root, ".manual-build-"));
        const staged = path.join(temporary, "site");
        render(staged);
        const manifest = readManifest(staged);
        if (!matchesOutput(staged, manifest?.outputs))
            throw new Error("Built manual does not match its output checksums");
        if (JSON.stringify(readInputs()) !== JSON.stringify(inputs))
            throw new Error(
                "Manual inputs changed during the build. Retry preparation."
            );
        writeFileSync(
            path.join(staged, ".build.json"),
            JSON.stringify({ ...manifest, inputs }, null, 2) + "\n",
            "utf8"
        );
        mkdirSync(path.dirname(output), { recursive: true });
        const previous = path.join(temporary, "previous");
        if (existsSync(output)) renameSync(output, previous);
        try {
            renameSync(staged, output);
        } catch (error) {
            if (existsSync(previous)) renameSync(previous, output);
            throw error;
        }
        console.log(`Prepared ${manifest.pages} local manual pages.`);
    } finally {
        // Retain the backup if a filesystem error also prevented restoration.
        if (
            temporary &&
            !(
                existsSync(path.join(temporary, "previous")) &&
                !existsSync(output)
            )
        )
            rmSync(temporary, { recursive: true, force: true });
        rmSync(lock, { recursive: true, force: true });
    }
}

/** Use the pinned submodule and installed dependencies for normal builds. */
export function prepareManual(
    root = fileURLToPath(new URL("../", import.meta.url))
) {
    prepareManualOutput(
        root,
        () => getBuildInputs(root),
        (output) => renderManual(root, output)
    );
}

if (
    process.argv[1] &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
    prepareManual();
