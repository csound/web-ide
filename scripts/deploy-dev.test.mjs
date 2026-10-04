import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import {
    changedFilesSinceSuccess,
    batchSize,
    requiredPermissions,
    functionDeployArgs,
    retryable,
    withRetry,
    selectTargets,
    ready,
    checkPermissions,
    unhealthyFunctions,
    deployBatches,
    waitUntilReady
} from "./deploy-dev.mjs";

const ids = ["fork_project", "host", "popular_projects"];
test("backend changes deploy the shared bundle; frontend changes only deploy host", () => {
    assert.deepEqual(selectTargets(ids, ["src/app.tsx"]), ["host"]);
    assert.deepEqual(
        selectTargets(ids, ["functions/src/fork_project.ts"]),
        ids
    );
    assert.deepEqual(selectTargets(ids, null), ids);
    assert.deepEqual(selectTargets(ids, []), []);
    assert.deepEqual(selectTargets(ids, [], ["fork_project"]), [
        "fork_project"
    ]);
    assert.deepEqual(selectTargets(ids, ["src/app.tsx"], ["fork_project"]), [
        "fork_project",
        "host"
    ]);
});
test("CPU quota and transient failures back off; IAM and ordinary health failures do not", async () => {
    assert.equal(
        retryable(
            new Error(
                "Container Healthcheck failed. Quota exceeded for total allowable CPU per project per region."
            )
        ),
        true
    );
    assert.equal(retryable(new Error("HTTP Error: 503")), true);
    for (const message of [
        "HTTP Error: 403",
        "PERMISSION_DENIED",
        "Container Healthcheck failed",
        "invalid_grant",
        "Quota exceeded; Permission run.services.setIamPolicy denied"
    ])
        assert.equal(retryable(new Error(message)), false);
    const waits = [];
    let calls = 0;
    await assert.rejects(
        withRetry(
            async () => {
                calls++;
                throw new Error("Quota exceeded");
            },
            async (ms) => waits.push(ms)
        ),
        /Quota exceeded/
    );
    assert.equal(calls, 4);
    assert.deepEqual(waits, [60000, 120000, 240000]);
    await assert.rejects(
        withRetry(
            async () => {
                throw new Error("HTTP Error: 403");
            },
            async () => assert.fail("Must not retry IAM")
        ),
        /403/
    );
});
test("preflight catches missing IAM write permission even when policies already allow access", async () => {
    await assert.rejects(
        checkPermissions({
            projectPermissions: async () =>
                requiredPermissions.filter(
                    (p) => p !== "run.services.setIamPolicy"
                )
        }),
        /lacks run.services.setIamPolicy/
    );
    await checkPermissions({
        projectPermissions: async () => requiredPermissions
    });
});
const endpoint = {
    id: "host",
    project: "csound-ide-dev",
    region: "us-central1",
    state: "ACTIVE",
    platform: "gcfv2",
    runServiceId: "host"
};
const service = {
    status: {
        latestCreatedRevisionName: "host-2",
        latestReadyRevisionName: "host-2",
        conditions: [{ type: "Ready", status: "True" }]
    }
};
test("an ACTIVE function with an older ready revision is still unhealthy", async () => {
    assert.equal(ready(endpoint, service), true);
    assert.equal(
        ready(endpoint, {
            status: { ...service.status, latestReadyRevisionName: "host-1" }
        }),
        false
    );
    assert.equal(
        ready(endpoint, {
            status: {
                ...service.status,
                conditions: [{ type: "Ready", status: "False" }]
            }
        }),
        false
    );
    assert.equal(ready({ ...endpoint, state: "FAILED" }, service), false);
    assert.equal(ready({ state: "ACTIVE", platform: "gcfv1" }), true);
    const client = {
        list: async () => [endpoint],
        service: async () => service
    };
    assert.deepEqual(await unhealthyFunctions(client, ["host", "missing"]), [
        "missing"
    ]);
    await waitUntilReady(client, ["host"], async () =>
        assert.fail("Already ready")
    );
    let waits = 0;
    await assert.rejects(
        waitUntilReady(client, ["missing"], async () => waits++),
        /Hosting was not published/
    );
    assert.equal(waits, 12);
    await assert.rejects(
        unhealthyFunctions(
            {
                ...client,
                service: async () => {
                    const error = new Error("Forbidden");
                    error.status = 403;
                    throw error;
                }
            },
            ["host"]
        ),
        /Forbidden/
    );
});
test("readiness shares its retry allowance across polls", async () => {
    let reads = 0;
    const waits = [];
    await assert.rejects(
        waitUntilReady(
            {
                list: async () => {
                    reads++;
                    if (reads % 2 === 0) throw new Error("HTTP Error: 503");
                    return [];
                }
            },
            ["host"],
            async (ms) => waits.push(ms)
        ),
        /HTTP Error: 503/
    );
    assert.equal(reads, 8);
    assert.deepEqual(
        waits.filter((ms) => ms > 10000),
        [60000, 120000, 240000]
    );
});

test("the job timeout covers all recovery waits with time left for deployment", async () => {
    let deploymentWait = 0;
    let deployAttempts = 0;
    await withRetry(
        async () => {
            if (deployAttempts++ < 3) throw new Error("Quota exceeded");
        },
        async (ms) => (deploymentWait += ms)
    );
    let readinessWait = 0;
    let reads = 0;
    await waitUntilReady(
        {
            list: async () => {
                reads++;
                // Interleave transient errors with all twelve not-ready polls.
                if ([4, 8, 12].includes(reads))
                    throw new Error("HTTP Error: 503");
                return reads === 16 ? [endpoint] : [];
            },
            service: async () => service
        },
        ["host"],
        async (ms) => (readinessWait += ms)
    );
    assert.equal(readinessWait, 9 * 60000);
    const batches = Math.ceil(16 / batchSize);
    const totalWait =
        batches * (deploymentWait + readinessWait) + readinessWait;
    const workflow = parse(
        await readFile(
            new URL("../.github/workflows/develop.yaml", import.meta.url),
            "utf8"
        )
    );
    assert.ok(
        workflow.jobs["deploy-dev"]["timeout-minutes"] * 60000 >=
            totalWait + 60 * 60000,
        "Allow at least an hour for installs, builds, API calls, and Hosting beyond recovery waits"
    );
});

test("named batches are sequential, bounded, and checked before the next deployment", async () => {
    assert.equal(batchSize, 2);
    const steps = [];
    await deployBatches(
        ids,
        async (args) => steps.push(args),
        async (batch) => steps.push(batch)
    );
    assert.deepEqual(steps, [
        functionDeployArgs(ids.slice(0, 2)),
        ids.slice(0, 2),
        functionDeployArgs(ids.slice(2)),
        ids.slice(2)
    ]);
    const args = functionDeployArgs(ids);
    assert.equal(
        args[args.indexOf("--only") + 1],
        "functions:fork_project,functions:host,functions:popular_projects"
    );
    assert.ok(args.includes("--non-interactive") && args.includes("--force"));
    let deploys = 0;
    await assert.rejects(
        deployBatches(
            ids,
            async () => deploys++,
            async () => {
                throw new Error("Not ready");
            }
        ),
        /Not ready/
    );
    assert.equal(deploys, 1);
});
test("dev serializes deploys, uses one ADC login and CLI, and checks access before publishing Hosting", async () => {
    const workflow = parse(
        await readFile(
            new URL("../.github/workflows/develop.yaml", import.meta.url),
            "utf8"
        )
    );
    assert.deepEqual(workflow.concurrency, {
        group: "deploy-csound-ide-dev",
        "cancel-in-progress": false
    });
    const steps = workflow.jobs["deploy-dev"].steps;
    assert.equal(
        steps.filter((s) => s.uses?.startsWith("google-github-actions/auth@"))
            .length,
        1
    );
    assert.equal(
        steps.some((s) => s.uses?.startsWith("docker://w9jds")),
        false
    );
    const position = (text) => {
        const index = steps.findIndex((s) => s.run?.includes(text));
        assert.ok(index >= 0, `Missing required workflow step: ${text}`);
        return index;
    };
    assert.ok(position("--preflight") < position("npm run build:dev"));
    assert.ok(position("--functions") < position("--only hosting"));
    assert.ok(position("--env dev --apply") < position("--only hosting"));
    assert.ok(position("--only hosting") < position("--env dev --check"));
});

test("change selection uses a successful ancestor and includes changes from failed runs", async () => {
    const ancestor = "a".repeat(40);
    const unrelated = "b".repeat(40);
    const environment = {
        GITHUB_REPOSITORY: "fixture/repo",
        GH_TOKEN: "fixture-token"
    };
    const request = async (url, options) => {
        assert.match(url, /branch=develop&status=success/);
        assert.equal(options.headers.Authorization, "Bearer fixture-token");
        return Response.json({
            workflow_runs: [
                { head_sha: unrelated },
                { head_sha: "invalid" },
                { head_sha: ancestor }
            ]
        });
    };
    const git = (args) => {
        if (args.includes(unrelated)) throw new Error("Not an ancestor");
        if (args[0] === "merge-base") return "";
        assert.deepEqual(args, ["diff", "--name-only", "-z", ancestor, "HEAD"]);
        return "functions/src/fork_project.ts\0src/app.tsx\0";
    };
    assert.deepEqual(
        await changedFilesSinceSuccess(request, git, environment),
        ["functions/src/fork_project.ts", "src/app.tsx"]
    );
    assert.equal(await changedFilesSinceSuccess(request, git, {}), null);
    assert.equal(
        await changedFilesSinceSuccess(
            async () => Response.json({ workflow_runs: [] }),
            git,
            environment
        ),
        null
    );
    await assert.rejects(
        changedFilesSinceSuccess(
            async () => new Response(null, { status: 403 }),
            git,
            environment
        ),
        /HTTP 403/
    );
});
