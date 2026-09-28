import { spawnSync } from "node:child_process";
import {
    cp,
    mkdir,
    mkdtemp,
    readFile,
    readdir,
    symlink,
    writeFile
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const functionsDir = path.join(root, "functions");
const firebaseDir = path.join(root, ".firebase");
const config = JSON.parse(
    await readFile(path.join(root, "firebase.json"), "utf8")
);
const projects = JSON.parse(
    await readFile(path.join(root, ".firebaserc"), "utf8")
);
const projectId = projects.projects.develop;

if (projectId !== "csound-ide-dev") {
    throw new Error("This deploy setup only supports csound-ide-dev.");
}

await mkdir(firebaseDir, { recursive: true });
const source = await mkdtemp(path.join(firebaseDir, "functions-dev-"));
const manifestPath = path.join(source, "functions.yaml");

// Use the SDK's discovery command so all triggers and options stay intact.
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
        stdio: "inherit",
        env: {
            ...process.env,
            GCLOUD_PROJECT: projectId,
            FIREBASE_CONFIG: JSON.stringify({
                projectId,
                storageBucket: "csound-ide-dev.appspot.com"
            }),
            FUNCTIONS_MANIFEST_OUTPUT_PATH: manifestPath
        }
    }
);
if (discovery.error) throw discovery.error;
if (discovery.status !== 0) {
    throw new Error(
        "Functions discovery failed. Build functions before preparing the dev deploy."
    );
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (Object.keys(manifest.extensions ?? {}).length > 0) {
    throw new Error(
        "Dev does not deploy Extensions. Remove their declarations before deploying."
    );
}
// firebase-tools 15.19.1 deploys Extensions even when the SDK reports {}.
delete manifest.extensions;
await writeFile(manifestPath, JSON.stringify(manifest, null, 4) + "\n");

// Keep this manifest out of the source used by production deploys.
for (const entry of await readdir(functionsDir)) {
    if (
        [
            "node_modules",
            "functions.yaml",
            "firebase-debug.log",
            ".git"
        ].includes(entry)
    )
        continue;
    await cp(path.join(functionsDir, entry), path.join(source, entry), {
        recursive: true
    });
}

// The CLI validates the installed SDK before reading the manifest. This relative
// link works in the CI checkout and in the Firebase action's Docker mount.
await symlink(
    path.relative(source, path.join(functionsDir, "node_modules")),
    path.join(source, "node_modules"),
    "dir"
);
config.functions.source = path.relative(root, source);
await writeFile(
    path.join(root, "firebase.dev.generated.json"),
    JSON.stringify(config, null, 4) + "\n"
);
console.log(
    `Prepared ${Object.keys(manifest.endpoints).length} dev functions without Extensions.`
);
