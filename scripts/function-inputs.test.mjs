import assert from "node:assert/strict";
import { test } from "node:test";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
    functionInputs,
    readInputs,
    selectInputTargets
} from "./function-inputs.mjs";

const ids = ["fork_project", "host", "popular_projects"];
const inputs = {
    schema: 1,
    project: "csound-ide-dev",
    backend: "a".repeat(64),
    host: "b".repeat(64)
};
const state = {
    unhealthy: [],
    deployed: Object.fromEntries(ids.map((id) => [id, `${id}-revision`]))
};
const previous = { ...inputs, deployed: state.deployed };

test("identical inputs and live deployments skip functions; HTML alone updates host", () => {
    assert.deepEqual(selectInputTargets(ids, inputs, previous, state), []);
    assert.deepEqual(
        selectInputTargets(
            ids,
            { ...inputs, host: "c".repeat(64) },
            previous,
            state
        ),
        ["host"]
    );
    assert.deepEqual(
        selectInputTargets(
            ids,
            { ...inputs, backend: "c".repeat(64) },
            previous,
            state
        ),
        ids
    );
});

test("unknown baselines, force, unhealthy functions, and deployment drift never silently skip", () => {
    for (const baseline of [
        null,
        {},
        { ...previous, schema: 2 },
        { ...previous, project: "csound-ide" },
        { ...previous, backend: "bad" }
    ])
        assert.deepEqual(selectInputTargets(ids, inputs, baseline, state), ids);
    assert.deepEqual(
        selectInputTargets(ids, inputs, previous, state, true),
        ids
    );
    assert.deepEqual(
        selectInputTargets(ids, inputs, previous, {
            ...state,
            unhealthy: ["host"]
        }),
        ["host"]
    );
    // A failed deploy changed a healthy function, then the source was reverted.
    assert.deepEqual(
        selectInputTargets(ids, inputs, previous, {
            ...state,
            deployed: { ...state.deployed, fork_project: "partial-deploy" }
        }),
        ["fork_project"]
    );
    assert.deepEqual(
        selectInputTargets(ids, inputs, { ...inputs }, state),
        ids
    );
    assert.deepEqual(
        selectInputTargets(ids, inputs, previous, { ...state, deployed: {} }),
        ids
    );
});

test("fingerprints cover uploaded bytes and deploy config, but not temporary paths or Hosting-only files", async (t) => {
    const root = await mkdtemp(path.join(tmpdir(), "function-inputs-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    const put = async (file, value) => {
        await mkdir(path.dirname(path.join(root, file)), { recursive: true });
        await writeFile(path.join(root, file), value);
    };
    const files = [
        "upload/package.json",
        "upload/package-lock.json",
        "upload/dist/main.js",
        "upload/functions.yaml",
        "upload/.env.csound-ide-dev",
        "upload/dist/index.html",
        "upload/index.html",
        ".firebaserc",
        ".github/workflows/develop.yaml",
        "scripts/deploy-dev.mjs",
        "scripts/function-inputs.mjs",
        "scripts/prepare-dev-deploy.mjs",
        "scripts/callable-access.mjs",
        "scripts/callable-access.json"
    ];
    for (const file of files) await put(file, "initial " + file);
    const config = { functions: { source: "upload", runtime: "nodejs22" } };
    const original = await functionInputs(root, config);
    await put("dist/manual/index.html", "new notices");
    await put("upload/node_modules/unused", "installed dependency copy");
    assert.deepEqual(await functionInputs(root, config), original);
    await cp(path.join(root, "upload"), path.join(root, "another-upload"), {
        recursive: true
    });
    assert.deepEqual(
        await functionInputs(root, {
            functions: { ...config.functions, source: "another-upload" }
        }),
        original
    );
    for (const file of files) {
        await put(file, "changed " + file);
        const changed = await functionInputs(root, config);
        if (file.endsWith("index.html")) {
            assert.equal(changed.backend, original.backend);
            assert.notEqual(changed.host, original.host);
        } else assert.notEqual(changed.backend, original.backend, file);
        await put(file, "initial " + file);
    }
    assert.notEqual(
        (
            await functionInputs(root, {
                functions: { ...config.functions, runtime: "nodejs24" }
            })
        ).backend,
        original.backend
    );
    await put("upload/extra.js", "added");
    assert.notEqual(
        (await functionInputs(root, config)).backend,
        original.backend
    );
    await rm(path.join(root, "upload/extra.js"));
    await rm(path.join(root, "upload/dist/main.js"));
    assert.notEqual(
        (await functionInputs(root, config)).backend,
        original.backend
    );
    const saved = path.join(root, "function-inputs.json");
    assert.equal(await readInputs(saved), null);
    await writeFile(saved, "broken JSON");
    assert.equal(await readInputs(saved), null);
    await writeFile(saved, JSON.stringify(previous));
    assert.deepEqual(await readInputs(saved), previous);
});
