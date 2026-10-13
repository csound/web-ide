import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import path from "node:path";
import { access, deploymentTarget } from "./callable-access.mjs";
import {
    functionInputs,
    readInputs,
    selectInputTargets
} from "./function-inputs.mjs";

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
    "run.services.update",
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
    const pending = [error];
    const seen = new Set();
    const messages = [];
    const statuses = [];
    while (pending.length) {
        const item = pending.pop();
        if (!item || seen.has(item)) continue;
        seen.add(item);
        messages.push(item.message || String(item));
        statuses.push(
            Number(item.status),
            Number(item.context?.response?.statusCode),
            Number(item.context?.body?.error?.code)
        );
        pending.push(item.original, item.cause);
        if (Array.isArray(item.children)) pending.push(...item.children);
        if (Array.isArray(item.errors)) pending.push(...item.errors);
    }
    const message = messages.join("\n");
    // A mixed failure containing a permission error must not be retried either.
    if (
        statuses.some((status) => [401, 403].includes(status)) ||
        /PERMISSION_DENIED|UNAUTHENTICATED|HTTP Error: (401|403)|permission.*denied|invalid_grant/i.test(
            message
        )
    )
        return false;
    return (
        statuses.some((status) => [429, 500, 502, 503, 504].includes(status)) ||
        /quota exceeded|RESOURCE_EXHAUSTED|HTTP Error: (429|500|502|503|504)|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up/i.test(
            message
        )
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

export async function inspectFunctions(client, ids) {
    const endpoints = await client.list();
    const unhealthy = [];
    const deployed = {};
    const services = {};
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
        else if (endpoint.platform === "gcfv2")
            services[id] = endpoint.runServiceId;
        // Match the live deployment as well as the build. A failed or manual
        // deploy may have changed healthy functions since the saved baseline.
        if (endpoint?.hash)
            deployed[id] = JSON.stringify([
                endpoint.hash,
                service?.status?.latestReadyRevisionName || null
            ]);
    }
    return { unhealthy, deployed, services };
}

export function hostingConfig(config, services) {
    const hosting = structuredClone(config.hosting);
    for (const site of Array.isArray(hosting) ? hosting : [hosting]) {
        site.rewrites = (site.rewrites || []).map((rewrite) => {
            if (!rewrite.function?.pinTag) return rewrite;
            const { functionId, region = access.region } = rewrite.function;
            const serviceId = services[functionId];
            assert.equal(region, access.region);
            assert.match(
                serviceId || "",
                /^[a-z][a-z0-9-]*$/,
                `No ready Cloud Run service for ${functionId}`
            );
            const { function: ignoredFunction, ...rest } = rewrite;
            // A function pin makes --only hosting redeploy the function. Pin its
            // verified Cloud Run service instead, preserving Hosting rollbacks.
            return { ...rest, run: { serviceId, region, pinTag: true } };
        });
    }
    return { hosting };
}

export async function unhealthyFunctions(client, ids) {
    return (await inspectFunctions(client, ids)).unhealthy;
}

export async function waitUntilReady(
    client,
    ids,
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
) {
    // Share the poll and transient retry limits across this entire check.
    let attempt = 0;
    return withRetry(async () => {
        for (; ; attempt++) {
            const state = await inspectFunctions(client, ids);
            const { unhealthy } = state;
            if (!unhealthy.length) return state;
            assert.ok(
                attempt < 12,
                `Functions are not ready on their latest revision: ${unhealthy.join(", ")}. Hosting was not published.`
            );
            console.log(
                `Waiting for latest revisions: ${unhealthy.join(", ")}`
            );
            await wait(10_000);
        }
    }, wait);
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

export async function successfulDeploy(
    request = fetch,
    git = readGit,
    environment = process.env
) {
    const repository = environment.GITHUB_REPOSITORY;
    const token = environment.GH_TOKEN;
    if (!repository || !token) return null;
    // A failed run is never a baseline: retrying it must include its backend changes.
    const response = await withRetry(async () => {
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
        if (!response.ok)
            throw Object.assign(
                new Error(
                    `Cannot find the last successful deploy: HTTP ${response.status}`
                ),
                { status: response.status }
            );
        return response;
    });
    for (const run of (await response.json()).workflow_runs) {
        if (
            !/^[a-f0-9]{40}$/.test(run.head_sha) ||
            !Number.isSafeInteger(run.id) ||
            String(run.id) === environment.GITHUB_RUN_ID
        )
            continue;
        try {
            git(["merge-base", "--is-ancestor", run.head_sha, "HEAD"]);
        } catch {
            continue;
        }
        return run;
    }
    return null;
}

async function main() {
    const { values } = parseArgs({
        options: {
            preflight: { type: "boolean" },
            baseline: { type: "boolean" },
            functions: { type: "boolean" },
            check: { type: "boolean" },
            repair: { type: "boolean" }
        }
    });
    assert.equal(
        Object.values(values).filter(Boolean).length,
        1,
        "Choose --baseline, --preflight, --functions, --repair, or --check"
    );
    if (values.baseline) {
        const previous = await successfulDeploy();
        await appendFile(
            process.env.GITHUB_OUTPUT,
            `run-id=${previous?.id || ""}\n`
        );
        return;
    }
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
    await withRetry(list);
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
    if (values.preflight) return withRetry(() => checkPermissions(client));
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
    await withRetry(() => checkPermissions(client));
    const state = await withRetry(() => inspectFunctions(client, ids));
    const current = await functionInputs(root, config);
    const previous =
        process.env.FUNCTION_BASELINE_RESTORED === "true"
            ? await readInputs(
                  path.join(
                      root,
                      ".firebase/previous-functions/function-inputs.json"
                  )
              )
            : null;
    const selected = values.repair
        ? state.unhealthy
        : selectInputTargets(
              ids,
              current,
              previous,
              state,
              process.env.FORCE_FUNCTIONS === "true"
          );
    console.log(
        `Selected ${selected.length}/${ids.length} functions for deployment.`
    );
    await deployBatches(selected, runFirebase, (batch) =>
        waitUntilReady(client, batch)
    );
    const verified = await waitUntilReady(client, ids);
    if (values.functions) {
        await writeFile(
            path.join(root, ".firebase/function-inputs.json"),
            JSON.stringify({ ...current, deployed: verified.deployed }) + "\n"
        );
        await writeFile(
            path.join(root, "firebase.dev.hosting.generated.json"),
            JSON.stringify(hostingConfig(config, verified.services), null, 4) +
                "\n"
        );
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
    await main();
