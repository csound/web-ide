import assert from "node:assert/strict";
import { test } from "node:test";
import {
    access,
    checkPreflights,
    desiredPolicy,
    reconcileAccess
} from "./dev-callable-access.mjs";

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

test("check detects missing access; apply repairs it once without replacing existing access", async () => {
    const policies = new Map();
    const writes = [];
    const client = {
        list: async () =>
            access.functions.map((id) => ({
                id,
                project: access.project,
                region: access.region,
                platform: "gcfv2",
                callableTrigger: {},
                runServiceId: id.replaceAll("_", "-")
            })),
        getPolicy: async (service) =>
            policies.get(service) ?? { etag: "fixture-etag" },
        setPolicy: async (service, policy) => {
            writes.push(service);
            policies.set(service, policy);
        }
    };
    await assert.rejects(reconcileAccess(client, false), /missing browser/);
    assert.equal(writes.length, 0);
    await reconcileAccess(client, true);
    assert.equal(writes.length, access.functions.length);
    await reconcileAccess(client, true);
    await reconcileAccess(client, false);
    assert.equal(writes.length, access.functions.length);

    for (const invalid of [
        { callableTrigger: undefined },
        { project: "csound-ide" },
        { runServiceId: "../../production" }
    ]) {
        const endpoints = await client.list();
        Object.assign(endpoints.at(-1), invalid);
        await assert.rejects(
            reconcileAccess({ ...client, list: async () => endpoints }, true),
            /expected a deployed dev callable/
        );
        assert.equal(writes.length, access.functions.length);
    }
});

test("preflight checks cover every declared function and origin without invoking a handler", async () => {
    const requests = [];
    await checkPreflights(async (url, options) => {
        requests.push([url, options.headers.Origin]);
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
        access.functions.length * access.origins.length
    );
    assert.equal(new Set(requests.map(JSON.stringify)).size, requests.length);
    await assert.rejects(
        checkPreflights(async () => new Response(null, { status: 403 })),
        /204/
    );
    await assert.rejects(
        checkPreflights(async () => new Response(null, { status: 204 })),
        /CORS must allow/
    );
});
