import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import {
    access,
    checkHosting,
    checkPreflights,
    desiredPolicy,
    deploymentTarget,
    iamPolicyClient,
    parseOptions,
    reconcileAccess
} from "./callable-access.mjs";

const declaredFunctions = [...access.functions, ...access.hostingFunctions];

test("every hosting rewrite function has a public access declaration", async () => {
    const { hosting } = JSON.parse(
        await readFile(new URL("../firebase.json", import.meta.url))
    );
    const functions = [
        ...new Set(
            hosting.rewrites
                .map(({ function: target }) =>
                    typeof target === "string" ? target : target?.functionId
                )
                .filter(Boolean)
        )
    ];
    assert.deepEqual([...access.hostingFunctions].sort(), functions.sort());
});

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
        if (env === "dev") {
            assert.equal(
                steps[deployIndex].run,
                "node scripts/deploy-dev.mjs --functions"
            );
            const authIndex = steps.findIndex((step) =>
                step.uses?.startsWith("google-github-actions/auth@")
            );
            assert.ok(authIndex >= 0 && authIndex < deployIndex);
            assert.equal(
                steps[authIndex].with.credentials_json,
                "${{ secrets.GCP_SA_KEY_DEV }}"
            );
        } else {
            const deployArgs = steps[deployIndex].with.args.split(/\s+/);
            assert.equal(
                deployArgs[deployArgs.indexOf("-P") + 1],
                access.environments[env].firebaseAlias
            );
            assert.equal(
                steps[applyIndex - 1].with.credentials_json,
                steps[deployIndex].env.GCP_SA_KEY
            );
        }
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
                declaredFunctions.map((id) => ({
                    id,
                    project: target.project,
                    region: access.region,
                    platform: "gcfv2",
                    ...(access.hostingFunctions.includes(id)
                        ? { httpsTrigger: {} }
                        : { callableTrigger: {} }),
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
                    const id = declaredFunctions[writes.length];
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
        assert.equal(writes.length, declaredFunctions.length);
        await reconcileAccess(client, target, true);
        await reconcileAccess(client, target, false);
        assert.equal(writes.length, declaredFunctions.length);

        for (const invalid of [
            { httpsTrigger: undefined },
            { eventTrigger: {} },
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
                /expected a deployed httpsTrigger/
            );
            assert.equal(writes.length, declaredFunctions.length);
        }
    });

    test(`${environment}: direct hosting loads catch forbidden responses and missing app shells`, async () => {
        const urls = [];
        await checkHosting(target, async (url, options) => {
            urls.push(url);
            assert.equal(options.method, "GET");
            assert.equal(options.redirect, "error");
            assert.match(options.headers["User-Agent"], /Mozilla/);
            return new Response('<div id="root"></div>', {
                headers: { "Content-Type": "text/html" }
            });
        });
        assert.deepEqual(
            urls,
            target.origins
                .filter((origin) => new URL(origin).hostname !== "localhost")
                .flatMap((origin) => [
                    `${origin}/`,
                    `${origin}/editor/__hosting_access_check__`,
                    `${origin}/profile/__hosting_access_check__`
                ])
        );
        await assert.rejects(
            checkHosting(
                target,
                async () => new Response("Error: Forbidden", { status: 403 })
            ),
            /hosting must allow/
        );
        await assert.rejects(
            checkHosting(
                target,
                async () =>
                    new Response("error", {
                        headers: { "Content-Type": "text/html" }
                    })
            ),
            /expected the app shell/
        );
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

test("a private hosting function fails the access check and gets repaired", async () => {
    const target = deploymentTarget("dev");
    const publicPolicy = desiredPolicy({ etag: "callable-etag" });
    let hostPolicy = { etag: "host-etag" };
    const writes = [];
    const client = {
        list: async () => [
            ...access.functions.map((id) => ({
                id,
                project: target.project,
                region: access.region,
                platform: "gcfv2",
                callableTrigger: {},
                runServiceId: id.replaceAll("_", "-")
            })),
            {
                id: "host",
                project: target.project,
                region: access.region,
                platform: "gcfv2",
                httpsTrigger: {},
                runServiceId: "host"
            }
        ],
        getPolicy: async (service) =>
            service.endsWith("/host") ? hostPolicy : publicPolicy,
        setPolicy: async (service, policy) => {
            writes.push(service);
            hostPolicy = policy;
        }
    };
    await assert.rejects(
        reconcileAccess(client, target, false),
        /host: missing browser/
    );
    assert.equal(writes.length, 0);
    await reconcileAccess(client, target, true);
    assert.deepEqual(writes, [
        `projects/${target.project}/locations/${access.region}/services/host`
    ]);
    await reconcileAccess(client, target, false);
});
