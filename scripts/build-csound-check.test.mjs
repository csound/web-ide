import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
    new URL("./build-csound-check.mjs", import.meta.url)
);

/** Exercise the build script with a fake Nix executable, without touching local assets. */
function fixture(t) {
    const root = mkdtempSync(join(tmpdir(), "checker-build-test-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const bin = join(root, "bin");
    mkdirSync(bin);
    writeFileSync(
        join(bin, "nix-build"),
        '#!/bin/sh\nif [ "$1" != "--version" ]; then printf "%s" "$TEST_NIX_OUTPUT"; fi\n',
        { mode: 0o755 }
    );
    return {
        root,
        run(output) {
            return spawnSync(process.execPath, [script, "--required"], {
                cwd: root,
                encoding: "utf8",
                env: { ...process.env, PATH: bin, TEST_NIX_OUTPUT: output }
            });
        }
    };
}

for (const output of ["", "\n \n", "relative/result\n"]) {
    test(`rejects invalid Nix output ${JSON.stringify(output)} before writing assets`, (t) => {
        const f = fixture(t);
        const result = f.run(output);
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /Expected a Nix output directory/);
        assert.ok(result.stderr.includes(JSON.stringify(output)));
        assert.equal(existsSync(join(f.root, ".wasm-build")), false);
    });
}

test("copies all artifacts from the trimmed final absolute output path", (t) => {
    const f = fixture(t);
    const output = join(f.root, "nix output");
    mkdirSync(output);
    const names = ["csound-check", "plugin-types", "plugin-types-fixture"];
    for (const name of names) writeFileSync(join(output, `${name}.wasm`), name);
    const result = f.run(`build output\n  ${output}  \n\n`);
    assert.equal(result.status, 0, result.stderr);
    for (const name of names)
        assert.equal(
            readFileSync(join(f.root, ".wasm-build", `${name}.wasm`), "utf8"),
            name
        );
});
