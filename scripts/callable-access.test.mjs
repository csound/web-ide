import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import {
    access,
    checkPreflights,
    desiredPolicy,
    deploymentTarget,
    iamPolicyClient,
    parseOptions,
    reconcileAccess
} from "./callable-access.mjs";

test("commands require an explicit known environment and exactly one mode", () => {
    for (const args of [
        [],
        ["--apply"],
        ["--env", "production", "--apply"],
        ["--env", "dev"],
        ["--env", "dev", "--check", "--apply"],
        ["--env", "prod", "--aply"]
    ]) {
        assert.throws(() => parseOptions(args));
    }
    for (const env of Object.keys(access.environments)) {
        for (const mode of ["check", "apply"]) {
            assert.deepEqual(parseOptions(["--env", env, `--${mode}`]), {
                target: deploymentTarget(env),
                apply: mode === "apply"
            });
        }
    }
});

test("both workflows apply the shared policy to the same project they deploy", async () => {
    const require = createRequire(
        new URL("../functions/package.json", import.meta.url)
    );
    const { parse } = require("yaml");
    for (const [env, file, job] of [
        ["dev", "develop.yaml", "deploy-dev"],
        ["prod", "production.yaml", "deploy-prod"]
    ]) {
        const workflow = parse(
            await readFile(
                new URL(`../.github/workflows/${file}`, import.meta.url),
                "utf8"
            )
        );
        const steps = workflow.jobs[job].steps;
        const deployIndex = steps.findIndex(
            (step) => step.name === "Deploy to Firebase"
        );
        const applyIndex = steps.findIndex(
            (step) => step.run === `npm run access -- --env ${env} --apply`
        );
        assert.ok(applyIndex > deployIndex);
        const deployArgs = steps[deployIndex].with.args.split(/\s+/);
        assert.equal(
            deployArgs[deployArgs.indexOf("-P") + 1],
            access.environments[env].firebaseAlias
        );
        assert.equal(
            steps[applyIndex - 1].with.credentials_json,
            steps[deployIndex].env.GCP_SA_KEY
        );
        assert.ok(
            steps.some((step) => step.run?.includes("npm run test:access"))
        );
    }
});

test("repair preserves other grants, conditions, and the concurrency etag", () => {
    const policy = {
        version: 3,
        etag: "fixture-etag",
        bindings: [
            { role: "roles/run.viewer", members: ["user:fixture@example.com"] },
            {
                role: "roles/run.invoker",
                members: ["allUsers"],
                condition: { title: "Expired", expression: "false" }
            },
            {
                role: "roles/run.invoker",
                members: ["serviceAccount:fixture@example.com"]
            }
        ]
    };
    const original = structuredClone(policy);
    const repaired = desiredPolicy(policy);
    assert.deepEqual(policy, original);
    const expected = structuredClone(original);
    expected.bindings[2].members.push("allUsers");
    assert.deepEqual(repaired, expected);
    assert.deepEqual(desiredPolicy(repaired), repaired);
});

for (const environment of Object.keys(access.environments)) {
    const target = deploymentTarget(environment);
    test(`${environment}: check detects missing access; apply repairs it once without replacing existing access`, async () => {
        const policies = new Map();
        const writes = [];
        const client = {
            list: async () =>
                access.functions.map((id) => ({
                    id,
                    project: target.project,
                    region: access.region,
                    platform: "gcfv2",
                    callableTrigger: {},
                    runServiceId: id.replaceAll("_", "-")
                })),
            ...iamPolicyClient({
                get: async (path, options) => {
                    assert.ok(path.endsWith(":getIamPolicy"));
                    assert.deepEqual(options, {
                        queryParams: { "options.requestedPolicyVersion": 3 }
                    });
                    const service = path.slice(0, -":getIamPolicy".length);
                    return {
                        body: policies.get(service) ?? {
                            version: 3,
                            etag: "fixture-etag",
                            bindings: [
                                {
                                    role: "roles/run.viewer",
                                    members: ["user:fixture@example.com"],
                                    condition: {
                                        title: "Expired",
                                        expression: "false"
                                    }
                                }
                            ]
                        }
                    };
                },
                post: async (path, body) => {
                    const id = access.functions[writes.length];
                    const service = `projects/${target.project}/locations/${access.region}/services/${id.replaceAll("_", "-")}`;
                    assert.equal(path, `${service}:setIamPolicy`);
                    assert.deepEqual(body, {
                        policy: {
                            version: 3,
                            etag: "fixture-etag",
                            bindings: [
                                {
                                    role: "roles/run.viewer",
                                    members: ["user:fixture@example.com"],
                                    condition: {
                                        title: "Expired",
                                        expression: "false"
                                    }
                                },
                                {
                                    role: "roles/run.invoker",
                                    members: ["allUsers"]
                                }
                            ]
                        },
                        updateMask: "bindings,etag"
                    });
                    writes.push(service);
                    policies.set(service, body.policy);
                }
            })
        };
        await assert.rejects(
            reconcileAccess(client, target, false),
            /missing browser/
        );
        assert.equal(writes.length, 0);
        await reconcileAccess(client, target, true);
        assert.equal(writes.length, access.functions.length);
        await reconcileAccess(client, target, true);
        await reconcileAccess(client, target, false);
        assert.equal(writes.length, access.functions.length);

        for (const invalid of [
            { callableTrigger: undefined },
            { project: "unrelated-project" },
            { runServiceId: "../../production" }
        ]) {
            const endpoints = await client.list();
            Object.assign(endpoints.at(-1), invalid);
            await assert.rejects(
                reconcileAccess(
                    { ...client, list: async () => endpoints },
                    target,
                    true
                ),
                /expected a deployed callable/
            );
            assert.equal(writes.length, access.functions.length);
        }
    });

    test(`${environment}: preflight checks cover every declared function and origin without invoking a handler`, async () => {
        const requests = [];
        await checkPreflights(target, async (url, options) => {
            requests.push([url, options.headers.Origin]);
            assert.ok(
                url.startsWith(
                    `https://${access.region}-${target.project}.cloudfunctions.net/`
                )
            );
            assert.equal(options.method, "OPTIONS");
            assert.equal(options.body, undefined);
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": options.headers.Origin,
                    "Access-Control-Allow-Methods": "POST",
                    "Access-Control-Allow-Headers": "authorization,content-type"
                }
            });
        });
        assert.equal(
            requests.length,
            access.functions.length * target.origins.length
        );
        assert.equal(
            new Set(requests.map(JSON.stringify)).size,
            requests.length
        );
        await assert.rejects(
            checkPreflights(
                target,
                async () => new Response(null, { status: 403 })
            ),
            /204/
        );
        await assert.rejects(
            checkPreflights(
                target,
                async () => new Response(null, { status: 204 })
            ),
            /CORS must allow/
        );
    });
}

test("IAM write failures reach the caller", async () => {
    const failure = new Error("Permission denied");
    const client = iamPolicyClient({
        post: async () => {
            throw failure;
        }
    });
    await assert.rejects(
        client.setPolicy("fixture-service", {}),
        (error) => error === failure
    );
});
