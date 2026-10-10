import { spawnSync } from "node:child_process";
import { mkdirSync, copyFileSync, renameSync, chmodSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

const required = process.argv.includes("--required");
const probe = spawnSync("nix-build", ["--version"], { encoding: "utf8" });
if (probe.error?.code === "ENOENT") {
    console.log("Skipping Csound checker: Nix is not installed.");
    process.exit(required ? 1 : 0);
}
if (probe.error || probe.status !== 0)
    throw new Error("Nix is installed but could not run.");
const build = spawnSync("nix-build", ["nix", "--no-out-link"], {
    encoding: "utf8",
    stdio: ["inherit", "pipe", "inherit"]
});
if (build.error || build.status !== 0) process.exit(build.status || 1);
const output = build.stdout.trim().split("\n").at(-1).trim();
if (!output || !isAbsolute(output))
    throw new Error(
        `Expected a Nix output directory, got ${JSON.stringify(build.stdout)}`
    );
mkdirSync(".wasm-build", { recursive: true });
for (const name of [
    "csound-check",
    "plugin-types",
    "plugin-types-fixture",
    "csound-ftgen"
]) {
    const file = `.wasm-build/${name}.wasm`;
    copyFileSync(resolve(output, `${name}.wasm`), `${file}.tmp`);
    chmodSync(`${file}.tmp`, 0o644);
    renameSync(`${file}.tmp`, file);
}
console.log(
    "Built Csound tools in .wasm-build. Restart Vite to enable checks and table previews."
);
