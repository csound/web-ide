import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

export const access = JSON.parse(
    await readFile(new URL("./callable-access.json", import.meta.url))
);
const { projects } = JSON.parse(
    await readFile(new URL("../.firebaserc", import.meta.url))
);
const { hosting } = JSON.parse(
    await readFile(new URL("../firebase.json", import.meta.url))
);

export function deploymentTarget(environment) {
    assert.ok(
        Object.hasOwn(access.environments, environment),
        "Choose --env dev or --env prod explicitly"
    );
    const target = access.environments[environment];
    const project = projects[target.firebaseAlias];
    assert.ok(typeof project === "string" && project.length > 0);
    return { environment, project, origins: target.origins };
}

export function parseOptions(args) {
    const { values } = parseArgs({
        args,
        options: {
            env: { type: "string" },
            check: { type: "boolean" },
            apply: { type: "boolean" }
        }
    });
    assert.ok(
        Boolean(values.check) !== Boolean(values.apply),
        "Choose exactly one of --check or --apply"
    );
    return { target: deploymentTarget(values.env), apply: !!values.apply };
}

// Cloud Run must admit browser requests to the app shell and callable handlers.
// The handlers and Firestore rules still enforce project access and user auth.
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

export function iamPolicyClient(iam) {
    return {
        getPolicy: async (service) =>
            (
                await iam.get(`${service}:getIamPolicy`, {
                    queryParams: { "options.requestedPolicyVersion": 3 }
                })
            ).body,
        setPolicy: (service, policy) =>
            iam.post(`${service}:setIamPolicy`, {
                policy,
                updateMask: "bindings,etag"
            })
    };
}

export async function reconcileAccess(client, target, apply) {
    assert.equal(access.role, "roles/run.invoker");
    assert.equal(access.member, "allUsers");
    const deployed = await client.list();
    // Validate the entire list before writing any policy. Never expose event
    // triggers or services outside the selected project.
    const declarations = [
        ...access.functions.map((id) => ({ id, trigger: "callableTrigger" })),
        ...access.hostingFunctions.map((id) => ({
            id,
            trigger: "httpsTrigger"
        }))
    ];
    const endpoints = declarations.map(({ id, trigger }) => {
        const endpoint = deployed.find(
            (item) =>
                item.id === id &&
                item.project === target.project &&
                item.region === access.region
        );
        assert.ok(
            endpoint?.platform === "gcfv2" &&
                endpoint[trigger] &&
                !endpoint.eventTrigger &&
                /^[a-z][a-z0-9-]*$/.test(endpoint.runServiceId ?? ""),
            `${id}: expected a deployed ${trigger} function in ${target.project}`
        );
        return endpoint;
    });
    for (const endpoint of endpoints) {
        const service = `projects/${target.project}/locations/${access.region}/services/${endpoint.runServiceId}`;
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

export async function checkPreflights(target, request = fetch) {
    for (const name of access.functions) {
        for (const origin of target.origins) {
            const response = await request(
                `https://${access.region}-${target.project}.cloudfunctions.net/${name}`,
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

// Use a browser user agent so synthetic URLs check the app shell without asking
// the metadata handler to read project or profile records.
export async function checkHosting(target, request = fetch) {
    const paths = hosting.rewrites
        .filter((rewrite) =>
            access.hostingFunctions.includes(
                typeof rewrite.function === "string"
                    ? rewrite.function
                    : rewrite.function?.functionId
            )
        )
        .map((rewrite) =>
            rewrite.source.replace("/**", "/__hosting_access_check__")
        );
    for (const origin of target.origins) {
        if (new URL(origin).hostname === "localhost") continue;
        for (const path of paths) {
            const url = new URL(path, origin).href;
            const response = await request(url, {
                method: "GET",
                redirect: "error",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
                },
                signal: AbortSignal.timeout(10000)
            });
            assert.equal(
                response.status,
                200,
                `${url}: hosting must allow browser page loads`
            );
            assert.match(
                response.headers.get("content-type") ?? "",
                /text\/html/i
            );
            assert.match(
                await response.text(),
                /id=["']root["']/,
                `${url}: expected the app shell`
            );
        }
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const { target, apply } = parseOptions(process.argv.slice(2));
    const require = createRequire(
        new URL("../functions/package.json", import.meta.url)
    );
    // Use the same Firebase CLI login or CI service account as deployment.
    const firebase = require("firebase-tools");
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
                    project: target.project,
                    nonInteractive: true
                }),
            ...iamPolicyClient(iam)
        },
        target,
        apply
    );
    // Allow time for an IAM change to reach the serving layer.
    for (let attempt = 0; ; attempt += 1) {
        try {
            await checkPreflights(target);
            await checkHosting(target);
            break;
        } catch (error) {
            if (!apply || attempt === 5) throw error;
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
    console.log(
        `${target.project}: browser access, CORS preflights, and hosting page loads passed.`
    );
}
