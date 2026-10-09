import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
    mkdtemp,
    mkdir,
    readFile,
    readdir,
    rm,
    writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import {
    download,
    inventoryPath,
    liveSnapshot,
    retainAssets,
    retentionMs
} from "./retain-hosting-assets.mjs";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const now = Date.UTC(2026, 9, 9);
const oldName = "/assets/tool-abcdefgh.js";
const newName = "/assets/tool-ijklmnop.js";
const oldBytes = Buffer.from("old tool");
const oldFile = { path: oldName, hash: digest(oldBytes) };

async function build(t) {
    const outDir = await mkdtemp(path.join(tmpdir(), "retained-assets-"));
    t.after(() => rm(outDir, { recursive: true, force: true }));
    await mkdir(path.join(outDir, "assets"));
    await writeFile(path.join(outDir, newName.slice(1)), "new tool");
    return outDir;
}

test("first deploy preserves assets without a previous inventory", async (t) => {
    const outDir = await build(t);
    const sources = new Map([
        [oldName, oldBytes],
        ["/assets/worker-12345678.js", Buffer.from("worker")],
        ["/assets/tool-12345678.wasm", Buffer.from("wasm")],
        ["/assets/tool-12345678.css", Buffer.from("css")]
    ]);
    const files = [...sources].map(([path, bytes]) => ({
        path,
        hash: digest(bytes)
    }));
    files.push(
        { path: "/index.html", hash: digest("old HTML") },
        { path: "/assets/../../escape-12345678.js", hash: digest("bad") }
    );
    assert.equal(
        await retainAssets({
            outDir,
            files,
            now,
            readAsset: async (file) => sources.get(file.path)
        }),
        4
    );
    assert.equal(
        await readFile(path.join(outDir, oldName.slice(1)), "utf8"),
        "old tool"
    );
    assert.deepEqual(
        JSON.parse(
            await readFile(path.join(outDir, inventoryPath.slice(1)), "utf8")
        ),
        {
            schema: 1,
            retired: Object.fromEntries(
                [...sources.keys()].map((file) => [file, now])
            )
        }
    );
    await assert.rejects(readFile(path.join(outDir, "index.html")), {
        code: "ENOENT"
    });
    await assert.rejects(
        retainAssets({
            outDir,
            files,
            now,
            readAsset: async (file) => sources.get(file.path)
        }),
        { code: "EEXIST" }
    );
});

test("unchanged active assets do not download and get a fresh retention period when replaced", async (t) => {
    const outDir = await build(t);
    await writeFile(path.join(outDir, oldName.slice(1)), oldBytes);
    assert.equal(
        await retainAssets({
            outDir,
            files: [oldFile],
            now,
            readAsset: () => {
                throw new Error("must not fetch");
            }
        }),
        0
    );
    const inventory = await readFile(path.join(outDir, inventoryPath.slice(1)));
    const next = await build(t);
    await retainAssets({
        outDir: next,
        files: [oldFile, { path: inventoryPath, hash: digest(inventory) }],
        now: now + 2 * retentionMs,
        readAsset: async (file) =>
            file.path === inventoryPath ? inventory : oldBytes
    });
    const recorded = JSON.parse(
        await readFile(path.join(next, inventoryPath.slice(1)))
    );
    assert.equal(recorded.retired[oldName], now + 2 * retentionMs);
});

test("later deployments do not renew expired files", async (t) => {
    const outDir = await build(t);
    const inventory = Buffer.from(
        JSON.stringify({ schema: 1, retired: { [oldName]: now - retentionMs } })
    );
    const fetched = [];
    assert.equal(
        await retainAssets({
            outDir,
            files: [oldFile, { path: inventoryPath, hash: digest(inventory) }],
            now,
            readAsset: async (file) => {
                fetched.push(file.path);
                return inventory;
            }
        }),
        0
    );
    assert.deepEqual(fetched, [inventoryPath]);
    assert.deepEqual(await readdir(path.join(outDir, "assets")), [
        path.basename(newName)
    ]);
});

test("aborts on a missing asset without writing a success inventory", async (t) => {
    const outDir = await build(t);
    await assert.rejects(
        retainAssets({
            outDir,
            files: [oldFile],
            now,
            readAsset: async () => {
                throw new Error("HTTP 404");
            }
        }),
        /HTTP 404/
    );
    await assert.rejects(readFile(path.join(outDir, inventoryPath.slice(1))), {
        code: "ENOENT"
    });
});

test("verifies the live ETag across compressed responses and rejects wrong releases", async () => {
    for (const encoding of ["", "-br", "-gzip"]) {
        const bytes = await download(
            "https://csound-ide.web.app",
            oldFile,
            "sites/csound-ide/versions/old",
            async (url) => {
                assert.equal(url.origin, "https://csound-ide.web.app");
                assert.equal(url.pathname, oldName);
                assert.equal(url.searchParams.get("deployment"), "old");
                return new Response(oldBytes, {
                    headers: { etag: `"${oldFile.hash}${encoding}"` }
                });
            }
        );
        assert.deepEqual(bytes, oldBytes);
    }
    for (const response of [
        new Response("Not found", { status: 404 }),
        new Response("wrong release"),
        new Response("wrong release", { headers: { etag: '"mismatch"' } })
    ]) {
        await assert.rejects(
            download(
                "https://csound-ide.web.app",
                oldFile,
                "old",
                async () => response
            ),
            /Cannot preserve|Live asset changed/
        );
    }
});

for (const retiredAt of [null, "yesterday", false, -1, now + 1, 1.5]) {
    test(`rejects a malformed retirement date (${JSON.stringify(retiredAt)})`, async (t) => {
        const outDir = await build(t);
        const inventory = Buffer.from(
            JSON.stringify({ schema: 1, retired: { [oldName]: retiredAt } })
        );
        await assert.rejects(
            retainAssets({
                outDir,
                files: [
                    oldFile,
                    { path: inventoryPath, hash: digest(inventory) }
                ],
                now,
                readAsset: async () => inventory
            }),
            /Invalid retirement date/
        );
        await assert.rejects(
            readFile(path.join(outDir, inventoryPath.slice(1))),
            {
                code: "ENOENT"
            }
        );
    });
}

test("reads the live channel and all pages of its active files", async () => {
    const calls = [];
    const version = "projects/123/sites/csound-ide/versions/old";
    const result = await liveSnapshot(
        {
            get: async (url, options) => {
                calls.push([url, options]);
                if (url.endsWith("/channels/live"))
                    return {
                        body: { release: { version: { name: version } } }
                    };
                assert.equal(options.queryParams.status, "ACTIVE");
                return {
                    body: options.queryParams.pageToken
                        ? { files: [oldFile] }
                        : { files: [], nextPageToken: "next" }
                };
            }
        },
        "csound-ide"
    );
    assert.equal(calls[0][0], "/projects/-/sites/csound-ide/channels/live");
    assert.equal(calls[2][1].queryParams.pageToken, "next");
    assert.deepEqual(result, { version, files: [oldFile] });
});

test("all deployments retain assets and pin HTML to the Hosting release", async () => {
    const { hosting } = JSON.parse(
        await readFile(new URL("../firebase.json", import.meta.url))
    );
    assert.deepEqual(hosting.predeploy, [
        "node scripts/retain-hosting-assets.mjs"
    ]);
    for (const route of hosting.rewrites.filter((route) => route.function)) {
        assert.deepEqual(route.function, {
            functionId: "host",
            region: "us-central1",
            pinTag: true
        });
    }
    const headers = (pathname) =>
        Object.fromEntries(
            hosting.headers
                .filter((rule) => path.matchesGlob(pathname, rule.source))
                .flatMap((rule) =>
                    rule.headers.map(({ key, value }) => [key, value])
                )
        );
    for (const url of [
        "/index.html",
        "/embed",
        "/embed/project",
        "/documentation",
        inventoryPath
    ])
        assert.equal(headers(url)["Cache-Control"], "no-cache");
    for (const url of [
        "/assets/tool-12345678.js",
        "/assets/tool-12345678.wasm"
    ])
        assert.match(headers(url)["Cache-Control"], /immutable/);
    assert.equal(
        headers("/editor/project")["Cross-Origin-Opener-Policy"],
        "same-origin"
    );
    for (const file of ["production.yaml", "develop.yaml"]) {
        const workflow = parse(
            await readFile(
                new URL(`../.github/workflows/${file}`, import.meta.url),
                "utf8"
            )
        );
        assert.equal(workflow.concurrency["cancel-in-progress"], false);
        assert.ok(workflow.concurrency.group);
    }
});

test("pinned HTML rewrites update each Cloud Run service once", async (t) => {
    const require = createRequire(
        new URL("../functions/package.json", import.meta.url)
    );
    const run = require("firebase-tools/lib/gcp/run.js");
    const runTags = require("firebase-tools/lib/hosting/runTags.js");
    const { hosting } = JSON.parse(
        await readFile(new URL("../firebase.json", import.meta.url))
    );
    let version = 1;
    let updates = 0;
    const service = {
        metadata: {
            name: "host",
            namespace: "fixture-project",
            resourceVersion: "1",
            generation: 1,
            labels: { "cloud.googleapis.com/location": "us-central1" }
        },
        spec: { traffic: [{ revisionName: "host-00001", percent: 100 }] },
        status: {
            latestReadyRevisionName: "host-00001",
            observedGeneration: 1,
            conditions: [{ type: "Ready", status: "True" }]
        }
    };
    // Run the real CLI pinning path against Cloud Run's optimistic concurrency
    // contract. Separate reads yield separate snapshots of the same version.
    t.mock.method(run, "getService", async () => structuredClone(service));
    t.mock.method(run, "replaceService", async (_name, replacement) => {
        assert.equal(
            replacement.metadata.resourceVersion,
            String(version),
            "Failed to replace Run service: resource version conflict"
        );
        version++;
        updates++;
        return { ...replacement, status: service.status };
    });
    const rewrites = hosting.rewrites
        .filter((rewrite) => rewrite.function?.pinTag)
        .map((rewrite) => ({
            source: rewrite.source,
            run: {
                serviceId: rewrite.function.functionId,
                region: rewrite.function.region,
                tag: runTags.TODO_TAG_NAME
            }
        }));
    await runTags.setRewriteTags(rewrites, "fixture-project", "new-release");
    assert.equal(updates, 1);
    assert.ok(
        rewrites.every((rewrite) => rewrite.run.tag === "fh-new-release")
    );
});

test("host routing keeps app paths pinned and leaves other routes alone", async () => {
    const { hosting } = JSON.parse(
        await readFile(new URL("../firebase.json", import.meta.url))
    );
    const route = (pathname) =>
        hosting.rewrites.find((rewrite) =>
            path.matchesGlob(pathname, rewrite.source)
        );
    for (const pathname of [
        "/",
        "/editor/",
        "/editor/project",
        "/editor/project/nested",
        "/profile/",
        "/profile/person"
    ]) {
        assert.equal(route(pathname)?.function?.functionId, "host", pathname);
        assert.equal(route(pathname)?.function?.pinTag, true, pathname);
    }
    for (const pathname of [
        "/editorial/example",
        "/profile-picture",
        "/assets/main-abcdefgh.js",
        "/404"
    ])
        assert.equal(route(pathname), undefined, pathname);
    for (const [pathname, destination] of [
        ["/embed", "/index.html"],
        ["/embed/project", "/index.html"],
        ["/manual/opcode", "/manual/404.html"],
        ["/documentation", "/index.html"],
        ["/documentation/page", "/index.html"]
    ])
        assert.equal(route(pathname)?.destination, destination, pathname);
});
