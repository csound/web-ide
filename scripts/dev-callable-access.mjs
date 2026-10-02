import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

export const access = JSON.parse(
    await readFile(new URL("./dev-callable-access.json", import.meta.url))
);

// Callable handlers still enforce Firebase authentication. Cloud Run must let
// browsers reach them, including preflight requests that carry no credentials.
export function desiredPolicy(current, declaration = access) {
    const policy = structuredClone(current);
    policy.bindings ??= [];
    let binding = policy.bindings.find(
        (item) => item.role === declaration.role && !item.condition
    );
    if (!binding) {
        binding = { role: declaration.role, members: [] };
        policy.bindings.push(binding);
    }
    if (!binding.members.includes(declaration.member)) {
        binding.members.push(declaration.member);
    }
    return policy;
}

export async function reconcileAccess(client, apply) {
    assert.equal(access.project, "csound-ide-dev");
    assert.equal(access.role, "roles/run.invoker");
    assert.equal(access.member, "allUsers");
    const deployed = await client.list();
    // Validate the entire list before writing any policy. Never expose event
    // triggers or services outside this dev project.
    const endpoints = access.functions.map((id) => {
        const endpoint = deployed.find(
            (item) =>
                item.id === id &&
                item.project === access.project &&
                item.region === access.region
        );
        assert.ok(
            endpoint?.platform === "gcfv2" &&
                endpoint.callableTrigger &&
                /^[a-z][a-z0-9-]*$/.test(endpoint.runServiceId ?? ""),
            `${id}: expected a deployed dev callable function`
        );
        return endpoint;
    });
    for (const endpoint of endpoints) {
        const service = `projects/${access.project}/locations/${access.region}/services/${endpoint.runServiceId}`;
        const current = await client.getPolicy(service);
        const desired = desiredPolicy(current);
        if (JSON.stringify(current) !== JSON.stringify(desired)) {
            assert.ok(
                apply,
                `${endpoint.id}: missing browser invocation access`
            );
            // Retain all other grants, conditions, and the concurrency etag.
            await client.setPolicy(service, desired);
            console.log(`${endpoint.id}: restored browser invocation access`);
        }
    }
}

export async function checkPreflights(request = fetch) {
    for (const name of access.functions) {
        for (const origin of access.origins) {
            const response = await request(
                `https://${access.region}-${access.project}.cloudfunctions.net/${name}`,
                {
                    method: "OPTIONS",
                    redirect: "error",
                    headers: {
                        Origin: origin,
                        "Access-Control-Request-Method": "POST",
                        "Access-Control-Request-Headers":
                            "authorization,content-type"
                    },
                    signal: AbortSignal.timeout(10000)
                }
            );
            assert.equal(response.status, 204, `${name} from ${origin}`);
            assert.ok(
                [origin, "*"].includes(
                    response.headers.get("access-control-allow-origin")
                ),
                `${name}: CORS must allow ${origin}`
            );
            const methods = response.headers
                .get("access-control-allow-methods")
                ?.split(/\s*,\s*/);
            const headers = response.headers
                .get("access-control-allow-headers")
                ?.toLowerCase()
                .split(/\s*,\s*/);
            assert.ok(
                methods?.includes("POST"),
                `${name}: CORS must allow POST`
            );
            assert.ok(
                headers?.includes("authorization") &&
                    headers.includes("content-type"),
                `${name}: CORS must allow callable request headers`
            );
        }
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const mode = process.argv.slice(2);
    assert.ok(
        mode.length === 1 && ["--check", "--apply"].includes(mode[0]),
        "Usage: node scripts/dev-callable-access.mjs --check|--apply"
    );
    const require = createRequire(
        new URL("../functions/package.json", import.meta.url)
    );
    // Use the same Firebase CLI login or CI service account as deployment.
    const firebase = require("firebase-tools");
    const run = require("firebase-tools/lib/gcp/run.js");
    const { Client } = require("firebase-tools/lib/apiv2.js");
    const iam = new Client({
        urlPrefix: "https://run.googleapis.com",
        apiVersion: "v1",
        auth: true
    });
    await reconcileAccess(
        {
            list: () =>
                firebase.functions.list({
                    project: access.project,
                    nonInteractive: true
                }),
            getPolicy: async (service) =>
                (
                    await iam.get(`${service}:getIamPolicy`, {
                        queryParams: { "options.requestedPolicyVersion": 3 }
                    })
                ).body,
            setPolicy: run.setIamPolicy
        },
        mode[0] === "--apply"
    );
    // Allow time for an IAM change to reach the serving layer.
    for (let attempt = 0; ; attempt += 1) {
        try {
            await checkPreflights();
            break;
        } catch (error) {
            if (mode[0] !== "--apply" || attempt === 5) throw error;
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
    console.log("Dev callable access and CORS preflights passed.");
}
