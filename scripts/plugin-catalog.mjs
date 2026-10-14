import assert from "node:assert/strict";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { plugins } from "@csound/plugins";
import { format } from "prettier";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const manifest = JSON.parse(await read("package.json"));
const groups = {
    chua: "Chua",
    image: "Image",
    linearAlgebra: "Linear algebra",
    stk: "STK"
};
assert.deepEqual(
    Object.keys(plugins).sort(),
    Object.keys(groups).sort(),
    "Document every plugin exported by the installed package"
);
globalThis.self = globalThis;
globalThis.window = globalThis;
const { libcsound } = await import("@csound/browser/dist/csound.js");
async function snapshot(withPlugins = []) {
    const api = await libcsound({ withPlugins });
    const csound = api.csoundCreate();
    let factory;
    try {
        const tree = api.csoundParseOrc(csound, "\n");
        assert.ok(tree, "Could not register plugin opcodes");
        api.wasm.exports.csoundDeleteTree(csound, tree);
        factory = api.csoundUgenFactoryNew(csound);
        return api.csoundUgenListOpcodes(factory);
    } finally {
        if (factory) api.csoundUgenFactoryDelete(factory);
        api.csoundDestroy(csound);
    }
}
const key = ({ opname, outypes, intypes }) =>
    JSON.stringify([opname, outypes, intypes]);
const baseline = new Set((await snapshot()).map(key));
const binaries = {};
const opcodes = [];
const linearHelp = JSON.parse(
    await read("manual/plugins/linear-algebra-help.json")
);
const linear = await read("manual/plugins/linear-algebra.md");
// Optional argument codes in these plugins: i=0, i=1, k=0, and k=-1.
const optional = {
    o: ["i", "0"],
    p: ["i", "1"],
    O: ["k", "0"],
    J: ["k", "-1"]
};
function syntax(name, signature) {
    const output = [...signature.outTypes]
        .map((rate, i) => `${rate}out${i + 1}`)
        .join(", ");
    const input = [...signature.inTypes]
        .map((rate, i) => {
            const opt = optional[rate];
            return opt
                ? `[${opt[0]}arg${i + 1} = ${opt[1]}]`
                : `${rate}arg${i + 1}`;
        })
        .join(", ");
    return `${output ? output + " " : ""}${name}${input ? " " + input : ""}`;
}
for (const [plugin, url] of Object.entries(plugins)) {
    const bytes = await readFile(new URL(url));
    binaries[plugin] = createHash("sha256").update(bytes).digest("hex");
    const signatures = (await snapshot([bytes])).filter(
        (entry) => !baseline.has(key(entry))
    );
    assert.ok(signatures.length, `${plugin} did not register any opcodes`);
    const byName = new Map();
    for (const entry of signatures) {
        const name = entry.opname.split(".")[0];
        const entries = byName.get(name) ?? [];
        const signature = { outTypes: entry.outypes, inTypes: entry.intypes };
        if (
            !entries.some(
                (value) => JSON.stringify(value) === JSON.stringify(signature)
            )
        )
            entries.push(signature);
        byName.set(name, entries);
    }
    for (const [name, signatures] of byName) {
        signatures.sort((a, b) =>
            JSON.stringify(a).localeCompare(JSON.stringify(b), "en")
        );
        let description, help;
        if (plugin === "linearAlgebra") {
            const operation = name.replace(/^la_[ik]_/, "");
            assert.ok(linearHelp[operation], `Missing description for ${name}`);
            description = linearHelp[operation];
            help = signatures.map((entry) => syntax(name, entry));
            // Use named arguments only when the reference agrees with the binary's arity and rates.
            const match = linear
                .split("\n")
                .find((line) => new RegExp(`\\b${name}\\b`).test(line));
            if (match && signatures.length === 1) {
                const [outputs, inputs] = match.split(name);
                const rates = (text) =>
                    (text.match(/\b[aikSf][a-zA-Z_0-9]*\b/g) ?? [])
                        .map((word) => word[0])
                        .join("");
                if (
                    rates(outputs) === signatures[0].outTypes &&
                    rates(inputs) === signatures[0].inTypes
                )
                    help = [match.trim().replace(/\s+/g, " ")];
            }
        } else {
            const article = await read(`manual/plugins/opcodes/${name}.md`);
            description = article.split("\n\n")[1].trim();
            help = [...article.matchAll(/``` text\n([\s\S]*?)\n```/g)]
                .flatMap((match) => match[1].split("\n"))
                .filter((line) => line.includes(name));
            assert.ok(help.length, `Missing synopsis for ${name}`);
        }
        opcodes.push({ name, plugin, description, syntax: help, signatures });
    }
}
assert.deepEqual(
    (await readdir(new URL("manual/plugins/opcodes/", root)))
        .filter((name) => name.endsWith(".md"))
        .map((name) => name.slice(0, -3))
        .sort(),
    opcodes
        .filter((entry) => entry.plugin !== "linearAlgebra")
        .map((entry) => entry.name)
        .sort(),
    "Review added or removed plugin articles"
);
opcodes.sort((a, b) => a.name.localeCompare(b.name, "en"));
const result = await format(
    JSON.stringify({
        package: manifest.dependencies["@csound/plugins"],
        browser: manifest.dependencies["@csound/browser"],
        groups,
        binaries,
        opcodes
    }),
    { parser: "json", tabWidth: 4 }
);
const output = new URL("src/plugins/catalog.json", root);
if (process.argv.includes("--check")) {
    assert.equal(
        await readFile(output, "utf8"),
        result,
        "Plugin catalog changed. Run npm run plugins:catalog and review its documentation."
    );
} else await writeFile(output, result);
console.log(`Checked ${opcodes.length} plugin opcode names.`);
