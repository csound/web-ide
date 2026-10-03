import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { getBuildInputs, prepareManualOutput } from "./prepare-manual.mjs";

/** Build tiny pages without touching the workspace's prepared manual. */
function fixture(t) {
    const root = mkdtempSync(path.join(tmpdir(), "manual-prepare-test-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const f = {
        root,
        output: path.join(root, "public/manual"),
        inputs: { sourceCommit: "pinned" },
        builds: 0,
        render(output) {
            f.builds++;
            mkdirSync(output);
            const outputs = {};
            for (const [name, content] of Object.entries({
                "index.html": "<h1>Csound</h1>",
                "example.csd": "instr 1\nendin\n"
            })) {
                writeFileSync(path.join(output, name), content);
                outputs[name] = createHash("sha256")
                    .update(content)
                    .digest("hex");
            }
            f.changeOutput?.(output, outputs);
            writeFileSync(
                path.join(output, ".build.json"),
                JSON.stringify({ pages: 1, outputs })
            );
        },
        prepare() {
            prepareManualOutput(root, () => ({ ...f.inputs }), f.render);
        }
    };
    return f;
}

test("caches a complete build and repairs missing or changed files", (t) => {
    const f = fixture(t);
    f.prepare();
    f.prepare();
    assert.equal(f.builds, 1);
    rmSync(path.join(f.output, "example.csd"));
    writeFileSync(path.join(f.output, "index.html"), "damaged");
    f.prepare();
    assert.equal(f.builds, 2);
    assert.equal(
        readFileSync(path.join(f.output, "index.html"), "utf8"),
        "<h1>Csound</h1>"
    );
    assert.equal(
        readFileSync(path.join(f.output, "example.csd"), "utf8"),
        "instr 1\nendin\n"
    );
    assert.equal(existsSync(path.join(f.root, ".manual-prepare.lock")), false);
});

test("source and dependency changes invalidate the cached build", (t) => {
    const f = fixture(t);
    f.prepare();
    f.inputs.sourceCommit = "updated";
    f.prepare();
    f.inputs.mathjax = "updated";
    f.prepare();
    assert.equal(f.builds, 3);
});

test("a failed renderer preserves the old manual and releases the lock", (t) => {
    const f = fixture(t);
    f.prepare();
    f.inputs.sourceCommit = "updated";
    f.render = () => {
        throw new Error("Renderer failed");
    };
    assert.throws(() => f.prepare(), /Renderer failed/);
    assert.equal(
        readFileSync(path.join(f.output, "index.html"), "utf8"),
        "<h1>Csound</h1>"
    );
    assert.equal(
        readdirSync(f.root).some((name) => name.startsWith(".manual-")),
        false
    );
});

test("an incomplete replacement cannot replace a valid manual", (t) => {
    const f = fixture(t);
    f.prepare();
    f.inputs.sourceCommit = "updated";
    f.changeOutput = (_, outputs) => {
        outputs["missing.html"] = "missing";
    };
    assert.throws(() => f.prepare(), /output checksums/);
    assert.equal(
        readFileSync(path.join(f.output, "index.html"), "utf8"),
        "<h1>Csound</h1>"
    );
});

test("rejects a build if its source changes while rendering", (t) => {
    const f = fixture(t);
    f.changeOutput = () => {
        f.inputs.sourceCommit = "changed-during-build";
    };
    assert.throws(() => f.prepare(), /inputs changed/);
    assert.equal(existsSync(f.output), false);
});

test("a concurrent preparation fails without removing the owner's lock", (t) => {
    const f = fixture(t);
    mkdirSync(path.join(f.root, ".manual-prepare.lock"));
    assert.throws(() => f.prepare(), /already locked/);
    assert.equal(existsSync(path.join(f.root, ".manual-prepare.lock")), true);
    assert.equal(existsSync(f.output), false);
});

test("a damaged manifest gets rebuilt", (t) => {
    const f = fixture(t);
    f.prepare();
    writeFileSync(path.join(f.output, ".build.json"), "{");
    f.prepare();
    assert.equal(f.builds, 2);
});

test("rejects output paths outside the staged site", (t) => {
    const f = fixture(t);
    f.changeOutput = (_, outputs) => {
        outputs["../escape.html"] = "unsafe";
    };
    assert.throws(() => f.prepare(), /output checksums/);
    assert.equal(existsSync(f.output), false);
});

test("explains how to initialize a missing manual submodule", (t) => {
    const f = fixture(t);
    assert.throws(
        () => getBuildInputs(f.root),
        /git submodule update --init --recursive/
    );
});
