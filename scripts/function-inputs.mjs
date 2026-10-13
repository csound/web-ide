import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { access, deploymentTarget } from "./callable-access.mjs";

const project = deploymentTarget("dev").project;
const digest = (value) => createHash("sha256").update(value).digest("hex");
const valid = (inputs) =>
    inputs?.schema === 1 &&
    inputs.project === project &&
    [inputs.backend, inputs.host].every(
        (value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value)
    );

// Hash the prepared upload, including compiled code, dependencies, manifest and
// environment files. Only host consumes the two copies of the built index.html.
export async function functionInputs(root, config) {
    const source = path.resolve(root, config.functions.source);
    const backend = [];
    const host = [];
    const walk = async (directory, prefix = "") => {
        const entries = await readdir(directory, { withFileTypes: true });
        for (const entry of entries.sort((a, b) =>
            a.name.localeCompare(b.name)
        )) {
            if (!prefix && entry.name === "node_modules") continue;
            const name = prefix + entry.name;
            const file = path.join(directory, entry.name);
            if (entry.isDirectory()) await walk(file, name + "/");
            else if (entry.isFile()) {
                const list = ["index.html", "dist/index.html"].includes(name)
                    ? host
                    : backend;
                list.push([name, digest(await readFile(file))]);
            } else
                throw new Error(
                    `Unexpected file type in function upload: ${name}`
                );
        }
    };
    await walk(source);
    if (!host.some(([name]) => name === "dist/index.html"))
        throw new Error("Build the host HTML before selecting functions.");
    const { source: ignoredSource, ...options } = config.functions;
    backend.push([
        "firebase-functions-config",
        digest(JSON.stringify(options))
    ]);
    // Changes to deployment rules or tools must not reuse an old decision.
    for (const file of [
        ".firebaserc",
        ".github/workflows/develop.yaml",
        "scripts/deploy-dev.mjs",
        "scripts/function-inputs.mjs",
        "scripts/prepare-dev-deploy.mjs",
        "scripts/callable-access.mjs",
        "scripts/callable-access.json"
    ])
        backend.push([file, digest(await readFile(path.join(root, file)))]);
    return {
        schema: 1,
        project,
        backend: digest(JSON.stringify(backend)),
        host: digest(JSON.stringify(host))
    };
}

export async function readInputs(file) {
    try {
        const inputs = JSON.parse(await readFile(file, "utf8"));
        return valid(inputs) ? inputs : null;
    } catch (error) {
        if (error.code === "ENOENT" || error instanceof SyntaxError)
            return null;
        throw error;
    }
}

export function selectInputTargets(
    ids,
    current,
    previous,
    state,
    force = false
) {
    if (force || !valid(previous) || previous.backend !== current.backend)
        return [...ids].sort();
    const selected = new Set(state.unhealthy);
    if (previous.host !== current.host)
        access.hostingFunctions.forEach((id) => selected.add(id));
    for (const id of ids) {
        // Missing hashes and drift after failed/manual deploys require a deploy.
        if (
            !state.deployed[id] ||
            previous.deployed?.[id] !== state.deployed[id]
        )
            selected.add(id);
    }
    return ids.filter((id) => selected.has(id)).sort();
}
