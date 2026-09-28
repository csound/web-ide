import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const functionsDir = path.join(root, "functions");
const require = createRequire(path.join(functionsDir, "package.json"));
const {
    detectFromYaml
} = require("firebase-tools/lib/deploy/functions/runtimes/discovery/index.js");
const {
    Delegate
} = require("firebase-tools/lib/deploy/functions/runtimes/node/index.js");
const { Config } = require("firebase-tools/lib/config.js");

test("dev skips the empty Extensions deploy and preserves every function and hosting route", async () => {
    const originalDir = await mkdtemp(
        path.join(tmpdir(), "web-ide-functions-")
    );
    const configPath = path.join(root, "firebase.dev.generated.json");
    const previousConfig = await readFile(configPath).catch((error) => {
        if (error.code !== "ENOENT") throw error;
    });
    let devSource;
    try {
        const originalManifest = path.join(originalDir, "functions.yaml");
        const discovery = spawnSync(
            process.execPath,
            [
                path.join(
                    functionsDir,
                    "node_modules/firebase-functions/lib/bin/firebase-functions.js"
                ),
                functionsDir
            ],
            {
                cwd: functionsDir,
                encoding: "utf8",
                env: {
                    ...process.env,
                    GCLOUD_PROJECT: "csound-ide-dev",
                    FIREBASE_CONFIG: JSON.stringify({
                        projectId: "csound-ide-dev",
                        storageBucket: "csound-ide-dev.appspot.com"
                    }),
                    FUNCTIONS_MANIFEST_OUTPUT_PATH: originalManifest
                }
            }
        );
        assert.equal(discovery.status, 0, discovery.stderr);
        const original = await detectFromYaml(
            originalDir,
            "csound-ide-dev",
            "nodejs22"
        );
        assert.deepEqual(original.extensions, {});

        const prepared = spawnSync(
            process.execPath,
            [path.join(root, "scripts/prepare-dev-deploy.mjs")],
            { encoding: "utf8" }
        );
        assert.equal(prepared.status, 0, prepared.stderr);
        const config = JSON.parse(await readFile(configPath, "utf8"));
        const production = JSON.parse(
            await readFile(path.join(root, "firebase.json"), "utf8")
        );
        const firebaseConfig = new Config(config, { cwd: root, configPath });
        devSource = firebaseConfig.path(config.functions.source);
        const delegate = new Delegate(
            "csound-ide-dev",
            root,
            devSource,
            "nodejs22"
        );
        await delegate.validate();
        const dev = await delegate.discoverBuild({}, {});
        assert.equal(dev.extensions, undefined);
        delete original.extensions;
        assert.deepEqual(dev, original);
        assert.ok(Object.keys(dev.endpoints).length > 0);
        assert.deepEqual(config.hosting, production.hosting);
        assert.equal(
            firebaseConfig.path(config.hosting.public),
            path.join(root, "dist")
        );
        assert.equal(production.functions.source, "./functions");
        assert.deepEqual(
            JSON.parse(
                await readFile(path.join(devSource, "package.json"), "utf8")
            ),
            JSON.parse(
                await readFile(path.join(functionsDir, "package.json"), "utf8")
            )
        );
        await assert.rejects(
            readFile(path.join(functionsDir, "functions.yaml")),
            { code: "ENOENT" }
        );
    } finally {
        await rm(originalDir, { recursive: true, force: true });
        if (devSource) await rm(devSource, { recursive: true, force: true });
        if (previousConfig) await writeFile(configPath, previousConfig);
        else await rm(configPath, { force: true });
    }
});
