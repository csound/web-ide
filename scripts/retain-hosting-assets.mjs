import assert from "node:assert/strict";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const inventoryPath = "/deployment-assets.json";
export const retentionMs = 30 * 24 * 60 * 60 * 1000;
const assetPath = /^\/assets\/[\w.-]+-[\w-]{8,}\.[\w.]+$/;

// Keep immutable files from the live release, including lazy JS, workers and
// WASM the browser has never fetched. Retention starts when a file is replaced,
// not when it was first built, so an infrequent deploy still gets a full month.
export async function retainAssets({
    outDir,
    files,
    readAsset,
    now = Date.now()
}) {
    const entries = await readdir(path.join(outDir, "assets"), {
        withFileTypes: true
    });
    const current = new Set(
        entries
            .filter((entry) => entry.isFile())
            .map(({ name }) => `/assets/${name}`)
    );
    assert.ok(current.size, "Build the app before preparing Hosting assets.");
    // A failed/partial preparation must not promote copied old files to current
    // assets on retry. Vite's clean build removes this marker before each deploy.
    await writeFile(
        path.join(outDir, ".hosting-assets-prepared"),
        "Rebuild before preparing again.\n",
        { flag: "wx" }
    );
    const previous = files.find(({ path: file }) => file === inventoryPath);
    let retired = {};
    if (previous) {
        const inventory = JSON.parse(await readAsset(previous));
        assert.equal(
            inventory.schema,
            1,
            "Unknown Hosting asset inventory schema."
        );
        assert.ok(
            inventory.retired &&
                typeof inventory.retired === "object" &&
                !Array.isArray(inventory.retired)
        );
        retired = inventory.retired;
    }
    const kept = {};
    const pending = [];
    for (const file of files) {
        if (!assetPath.test(file.path)) continue;
        // Vite hashes these names from their content; use the new build's copy
        // when it already has the same immutable URL.
        if (current.has(file.path)) continue;
        const replacedAt = retired[file.path] ?? now;
        assert.ok(
            Number.isSafeInteger(replacedAt) &&
                replacedAt >= 0 &&
                replacedAt <= now,
            `Invalid retirement date for ${file.path}`
        );
        if (now - replacedAt >= retentionMs) continue;
        kept[file.path] = replacedAt;
        pending.push(file);
    }
    await mkdir(path.join(outDir, "assets"), { recursive: true });
    // Bound memory and parallel downloads when several large WASM files changed.
    const queue = [...pending];
    await Promise.all(
        Array.from({ length: Math.min(4, queue.length) }, async () => {
            for (let file; (file = queue.pop()); ) {
                const bytes = await readAsset(file);
                await writeFile(path.join(outDir, file.path.slice(1)), bytes, {
                    flag: "wx"
                });
            }
        })
    );
    await writeFile(
        path.join(outDir, inventoryPath.slice(1)),
        JSON.stringify({ schema: 1, retired: kept }) + "\n"
    );
    return pending.length;
}

export async function liveSnapshot(client, site) {
    const { body: channel } = await client.get(
        `/projects/-/sites/${site}/channels/live`
    );
    const version = channel.release?.version?.name;
    assert.ok(
        typeof version === "string" &&
            new RegExp(
                `^(projects/[0-9]+/)?sites/${site}/versions/[a-zA-Z0-9_-]+$`
            ).test(version),
        "The live Hosting release has no version."
    );
    const files = [];
    let pageToken = "";
    do {
        const { body } = await client.get(`/${version}/files`, {
            queryParams: { status: "ACTIVE", pageSize: 1000, pageToken }
        });
        files.push(...(body.files ?? []));
        pageToken = body.nextPageToken ?? "";
    } while (pageToken);
    assert.ok(
        files.some(({ path: file }) => assetPath.test(file)),
        "The live release has no hashed assets; refusing to discard it."
    );
    return { version, files };
}

export async function download(origin, file, version, fetchAsset = fetch) {
    assert.ok(
        assetPath.test(file.path) || file.path === inventoryPath,
        "Invalid asset path."
    );
    assert.match(file.hash, /^[a-f0-9]{64}$/);
    const url = new URL(file.path, origin);
    url.searchParams.set("deployment", version.split("/").at(-1));
    const response = await fetchAsset(url, {
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(120000)
    });
    assert.ok(
        response.ok,
        `Cannot preserve ${file.path}: HTTP ${response.status}`
    );
    // The API hashes uploaded gzip bytes. fetch() returns decoded bytes, and
    // recompressing with a different zlib version changes that hash. Hosting's
    // ETag carries the original hash, with a suffix for the served encoding.
    assert.match(
        response.headers.get("etag") ?? "",
        new RegExp(`^"${file.hash}(-(gzip|br))?"$`),
        `Live asset changed or is incomplete: ${file.path}`
    );
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
        size += chunk.length;
        assert.ok(size <= 128 * 1024 * 1024, `Asset too large: ${file.path}`);
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    // Firebase supplies GCLOUD_PROJECT to Hosting predeploy hooks. Do not infer
    // the target from the local default project or download from another site.
    const site = process.env.GCLOUD_PROJECT;
    assert.ok(
        ["csound-ide", "csound-ide-dev"].includes(site),
        "Run through firebase deploy for csound-ide or csound-ide-dev."
    );
    const root = fileURLToPath(new URL("../", import.meta.url));
    const require = createRequire(
        new URL("../functions/package.json", import.meta.url)
    );
    const { requireAuth } = require("firebase-tools/lib/requireAuth.js");
    const { Client } = require("firebase-tools/lib/apiv2.js");
    const { getProjectDefaultAccount } = require("firebase-tools/lib/auth.js");
    await requireAuth({
        project: site,
        nonInteractive: true,
        ...getProjectDefaultAccount(root)
    });
    const api = new Client({
        urlPrefix: "https://firebasehosting.googleapis.com",
        apiVersion: "v1beta1",
        auth: true
    });
    const client = {
        get: (url, options = {}) =>
            api.get(url, {
                ...options,
                headers: { "x-goog-user-project": site }
            })
    };
    const { version, files } = await liveSnapshot(client, site);
    const count = await retainAssets({
        outDir: path.join(root, "dist"),
        files,
        readAsset: (file) => download(`https://${site}.web.app`, file, version)
    });
    const latest = await liveSnapshot(client, site);
    assert.equal(
        latest.version,
        version,
        "Hosting changed during preparation; rebuild and retry."
    );
    console.log(
        `${site}: retained ${count} hashed assets for existing tabs (30 days after replacement).`
    );
}
