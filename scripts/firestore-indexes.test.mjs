import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";
import { parse } from "yaml";

const require = createRequire(
    new URL("../functions/package.json", import.meta.url)
);
const { FirestoreApi } = require("firebase-tools/lib/firestore/api.js");
const config = JSON.parse(
    await readFile(new URL("../firebase.json", import.meta.url))
);
const rankingFields = [
    { fieldPath: "public", order: "ASCENDING" },
    { fieldPath: "starCount", order: "DESCENDING" },
    { fieldPath: "__name__", order: "ASCENDING" }
];
const recentFields = [
    { fieldPath: "public", order: "ASCENDING" },
    { fieldPath: "created", order: "DESCENDING" },
    { fieldPath: "__name__", order: "DESCENDING" }
];
async function readSpec() {
    assert.equal(config.firestore?.indexes, "firestore.indexes.json");
    return JSON.parse(
        await readFile(
            new URL(`../${config.firestore.indexes}`, import.meta.url)
        )
    );
}

test("shared indexes cover public rankings and retain the recent-project query", async () => {
    const spec = await readSpec();
    new FirestoreApi().validateSpec(spec);
    for (const fields of [rankingFields, recentFields]) {
        assert.ok(
            spec.indexes.some(
                (index) =>
                    index.collectionGroup === "projects" &&
                    index.queryScope === "COLLECTION" &&
                    JSON.stringify(index.fields) === JSON.stringify(fields)
            )
        );
    }
    assert.deepEqual(spec.fieldOverrides, []);
    assert.equal(config.firestore.rules, undefined);
});

for (const [file, job, alias] of [
    ["develop.yaml", "deploy-dev", "develop"],
    ["production.yaml", "deploy-prod", "default"]
]) {
    test(`${alias}: deployment creates the ranking index without deleting existing indexes or field settings`, async () => {
        const workflow = parse(
            await readFile(
                new URL(`../.github/workflows/${file}`, import.meta.url),
                "utf8"
            )
        );
        const steps = workflow.jobs[job].steps;
        const indexStep = steps.findIndex(
            (step) => step.name === "Deploy Firestore indexes"
        );
        const appStep = steps.findIndex(
            (step) => step.name === "Deploy to Firebase"
        );
        assert.ok(indexStep >= 0 && indexStep < appStep);
        const args = steps[indexStep].with.args.split(/\s+/);
        const argument = (flag) => args[args.indexOf(flag) + 1];
        assert.equal(argument("--only"), "firestore:indexes");
        assert.equal(argument("--config"), "firebase.json");
        assert.equal(argument("-P"), alias);
        assert.equal(args.includes("--non-interactive"), true);
        assert.equal(args.includes("--force"), false);
        assert.equal(steps[indexStep].uses, steps[appStep].uses);
        assert.equal(
            steps[indexStep].env.GCP_SA_KEY,
            steps[appStep].env.GCP_SA_KEY
        );
        const appArgs = steps[appStep].with.args.split(/\s+/);
        assert.equal(
            appArgs[appArgs.indexOf("--only") + 1],
            "functions,hosting"
        );
        assert.ok(
            steps.some((step) => step.run?.includes("npm run test:indexes"))
        );

        const project = `fixture-${alias}`;
        const parent = `projects/${project}/databases/(default)`;
        const existing = [
            {
                name: `${parent}/collectionGroups/projects/indexes/recent`,
                queryScope: "COLLECTION",
                fields: recentFields
            },
            {
                name: `${parent}/collectionGroups/other/indexes/keep`,
                queryScope: "COLLECTION",
                fields: [
                    { fieldPath: "owner", order: "ASCENDING" },
                    { fieldPath: "__name__", order: "ASCENDING" }
                ]
            }
        ];
        const created = [];
        const api = new FirestoreApi();
        api.apiClient = {
            get: async (path) => {
                if (path.endsWith("/indexes"))
                    return { body: { indexes: existing } };
                if (path.includes("/fields?"))
                    return {
                        body: {
                            fields: [
                                {
                                    name: `${parent}/collectionGroups/other/fields/keep`,
                                    ttlConfig: { state: "ACTIVE" },
                                    indexConfig: { indexes: [] }
                                }
                            ]
                        }
                    };
                if (path === `/${parent}`)
                    return { body: { databaseEdition: "STANDARD" } };
                assert.fail(`Unexpected read: ${path}`);
            },
            post: async (path, body) => {
                assert.equal(
                    path,
                    `/${parent}/collectionGroups/projects/indexes`
                );
                assert.deepEqual(body.fields, rankingFields);
                assert.equal(body.queryScope, "COLLECTION");
                created.push(body);
                existing.push({
                    name: `${parent}/collectionGroups/projects/indexes/ranking`,
                    ...body
                });
                return { body: {} };
            },
            delete: async () => assert.fail("Must not delete existing indexes"),
            patch: async () => assert.fail("Must not change field settings")
        };
        const spec = await readSpec();
        const options = {
            project,
            nonInteractive: args.includes("--non-interactive"),
            force: args.includes("--force")
        };
        await api.deploy(
            options,
            structuredClone(spec.indexes),
            spec.fieldOverrides
        );
        assert.equal(created.length, 1);
        await api.deploy(
            options,
            structuredClone(spec.indexes),
            spec.fieldOverrides
        );
        assert.equal(created.length, 1);
    });
}
