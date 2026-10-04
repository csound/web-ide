import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import path from "node:path";
import { access, deploymentTarget } from "./callable-access.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const target = deploymentTarget("dev");
assert.equal(target.project, "csound-ide-dev");
export const batchSize = 2;
export const requiredPermissions = [
    "cloudfunctions.functions.list",
    "cloudfunctions.functions.create",
    "cloudfunctions.functions.update",
    "run.services.get",
    "run.services.list",
    "run.services.getIamPolicy",
    "run.services.setIamPolicy"
];
export const functionDeployArgs = (ids) => [
    "deploy",
    "--project",
    target.project,
    "--config",
    "firebase.dev.generated.json",
    "--only",
    ids.map((id) => `functions:${id}`).join(","),
    "--non-interactive",
    "--force"
];

export function retryable(error) {
    const message = error.message || String(error);
    // A mixed failure containing a permission error must not be retried either.
    if (
        /PERMISSION_DENIED|UNAUTHENTICATED|HTTP Error: (401|403)|permission.*denied|invalid_grant/i.test(
            message
        )
    )
        return false;
    return /quota exceeded|RESOURCE_EXHAUSTED|HTTP Error: (429|500|502|503|504)|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up/i.test(
        message
    );
}

export async function withRetry(
    operation,
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
) {
    for (let attempt = 0; ; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === 3 || !retryable(error)) throw error;
            const delay = 60_000 * 2 ** attempt;
            console.log(
                `Transient deploy failure; retry ${attempt + 1}/3 in ${delay / 1000}s.`
            );
            await wait(delay);
        }
    }
}

export function selectTargets(ids, changedFiles, unhealthy = []) {
    // Functions share one source bundle. Backend/config changes can affect any
    // export; frontend-only changes need the host's bundled index.html updated.
    const backendChanged =
        changedFiles === null ||
        changedFiles.some(
            (file) =>
                file.startsWith("functions/") ||
                file === "firebase.json" ||
                file === ".firebaserc" ||
                file === ".github/workflows/develop.yaml" ||
                file.startsWith("scripts/prepare-dev-deploy")
        );
    const selected = new Set(unhealthy);
    if (backendChanged) ids.forEach((id) => selected.add(id));
    else if (changedFiles.length)
        access.hostingFunctions.forEach((id) => selected.add(id));
    return ids.filter((id) => selected.has(id)).sort();
}

export function ready(endpoint, service) {
    if (endpoint?.state !== "ACTIVE") return false;
    if (endpoint.platform === "gcfv1") return true;
    if (endpoint.platform !== "gcfv2" || !service) return false;
    const status = service.status;
    return !!(
        status?.latestCreatedRevisionName &&
        status.latestCreatedRevisionName === status.latestReadyRevisionName &&
        status.conditions?.some(
            (condition) =>
                condition.type === "Ready" && condition.status === "True"
        )
    );
}

export async function checkPermissions(client) {
    const granted = await client.projectPermissions(requiredPermissions);
    const missing = requiredPermissions.filter(
        (permission) => !granted.includes(permission)
    );
    assert.equal(
        missing.length,
        0,
        `${target.project}: deploy identity lacks ${missing.join(", ")}. Fix its IAM grants before deploying; retries cannot fix permissions.`
    );
    console.log(
        `${target.project}: deployment and browser-access IAM checks passed.`
    );
}

export async function unhealthyFunctions(client, ids) {
    const endpoints = await client.list();
    const unhealthy = [];
    for (const id of ids) {
        const endpoint = endpoints.find(
            (item) =>
                item.id === id &&
                item.project === target.project &&
                item.region === access.region
        );
        let service;
        if (endpoint?.platform === "gcfv2" && endpoint.runServiceId) {
            assert.match(endpoint.runServiceId, /^[a-z][a-z0-9-]*$/);
            try {
                service = await client.service(endpoint.runServiceId);
            } catch (error) {
                if (error.status !== 404) throw error;
            }
        }
        if (!ready(endpoint, service)) unhealthy.push(id);
    }
    return unhealthy;
}

export async function waitUntilReady(
    client,
    ids,
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
) {
    for (let attempt = 0; ; attempt++) {
        const unhealthy = await withRetry(
            () => unhealthyFunctions(client, ids),
            wait
        );
        if (!unhealthy.length) return;
        assert.ok(
            attempt < 12,
            `Functions are not ready on their latest revision: ${unhealthy.join(", ")}. Hosting was not published.`
        );
        console.log(`Waiting for latest revisions: ${unhealthy.join(", ")}`);
        await wait(10_000);
    }
}

export async function deployBatches(ids, deploy, check) {
    for (let offset = 0; offset < ids.length; offset += batchSize) {
        const batch = ids.slice(offset, offset + batchSize);
        console.log(`Deploying ${batch.join(", ")}`);
        await withRetry(() => deploy(functionDeployArgs(batch)));
        await check(batch);
    }
}

function runFirebase(args) {
    return new Promise((resolve, reject) => {
        const child = spawn(
            process.execPath,
            [
                path.join(
                    root,
                    "functions/node_modules/firebase-tools/lib/bin/firebase.js"
                ),
                ...args
            ],
            { cwd: root, env: process.env, stdio: ["ignore", "pipe", "pipe"] }
        );
        let output = "";
        for (const stream of [child.stdout, child.stderr])
            stream.on("data", (data) => {
                process.stdout.write(data);
                output = (output + data.toString()).slice(-131072);
            });
        child.on("error", reject);
        child.on("close", (code) =>
            code === 0
                ? resolve()
                : reject(new Error(`Firebase exited ${code}: ${output}`))
        );
    });
}

const readGit = (args) =>
    execFileSync("git", args, {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"]
    });

export async function changedFilesSinceSuccess(
    request = fetch,
    git = readGit,
    environment = process.env
) {
    const repository = environment.GITHUB_REPOSITORY;
    const token = environment.GH_TOKEN;
    if (!repository || !token) return null;
    // A failed run is never a baseline: retrying it must include its backend changes.
    const response = await request(
        `https://api.github.com/repos/${repository}/actions/workflows/develop.yaml/runs?branch=develop&status=success&per_page=30`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json"
            },
            signal: AbortSignal.timeout(10000)
        }
    );
    assert.ok(
        response.ok,
        `Cannot find the last successful deploy: HTTP ${response.status}`
    );
    for (const run of (await response.json()).workflow_runs) {
        if (!/^[a-f0-9]{40}$/.test(run.head_sha)) continue;
        try {
            git(["merge-base", "--is-ancestor", run.head_sha, "HEAD"]);
        } catch {
            continue;
        }
        return git(["diff", "--name-only", "-z", run.head_sha, "HEAD"])
            .split("\0")
            .filter(Boolean);
    }
    return null;
}

async function main() {
    const { values } = parseArgs({
        options: {
            preflight: { type: "boolean" },
            functions: { type: "boolean" },
            check: { type: "boolean" },
            repair: { type: "boolean" }
        }
    });
    assert.equal(
        Object.values(values).filter(Boolean).length,
        1,
        "Choose --preflight, --functions, --repair, or --check"
    );
    const require = createRequire(
        new URL("../functions/package.json", import.meta.url)
    );
    const firebase = require("firebase-tools");
    const { Client } = require("firebase-tools/lib/apiv2.js");
    // Initialize the CLI's ADC credentials before its API clients make requests.
    const list = () =>
        firebase.functions.list({
            project: target.project,
            nonInteractive: true
        });
    await list();
    const run = new Client({
        urlPrefix: "https://run.googleapis.com",
        apiVersion: "v1",
        auth: true
    });
    const projects = new Client({
        urlPrefix: "https://cloudresourcemanager.googleapis.com",
        apiVersion: "v1",
        auth: true
    });
    const client = {
        list,
        service: async (id) =>
            (
                await run.get(
                    `projects/${target.project}/locations/${access.region}/services/${id}`
                )
            ).body,
        projectPermissions: async (permissions) =>
            (
                await projects.post(
                    `projects/${target.project}:testIamPermissions`,
                    { permissions }
                )
            ).body.permissions || []
    };
    if (values.preflight) return checkPermissions(client);
    const config = JSON.parse(
        await readFile(path.join(root, "firebase.dev.generated.json"), "utf8")
    );
    const manifest = JSON.parse(
        await readFile(
            path.join(root, config.functions.source, "functions.yaml"),
            "utf8"
        )
    );
    const ids = Object.keys(manifest.endpoints).sort();
    assert.ok(
        ids.length && ids.every((id) => /^[a-z][a-z0-9_]*$/.test(id)),
        "Expected named dev function exports"
    );
    if (values.check) return waitUntilReady(client, ids);
    await checkPermissions(client);
    const changed = values.repair ? [] : await changedFilesSinceSuccess();
    const selected = selectTargets(
        ids,
        changed,
        await unhealthyFunctions(client, ids)
    );
    console.log(
        `Selected ${selected.length}/${ids.length} functions for deployment.`
    );
    await deployBatches(selected, runFirebase, (batch) =>
        waitUntilReady(client, batch)
    );
    await waitUntilReady(client, ids);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
    await main();
