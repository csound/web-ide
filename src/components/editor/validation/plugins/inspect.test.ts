// @vitest-environment node
import { readFileSync, existsSync } from "node:fs";
import { beforeAll, afterAll, expect, it, vi } from "vitest";
import { runCheck } from "../run";
import type { inspectPlugins as Inspect } from "./inspect";
let inspectPlugins: typeof Inspect;
beforeAll(async () => {
    vi.stubGlobal("self", globalThis);
    vi.stubGlobal("window", { atob, btoa });
    ({ inspectPlugins } = await import("./inspect"));
});
afterAll(() => vi.unstubAllGlobals());
const bytes = (name: string) =>
    new Uint8Array(
        readFileSync(`node_modules/@csound/wasm-bin/lib/${name}.wasm`)
    );
it("reads real C and C++ plugin registrations without compiling or performing an orchestra", async () => {
    expect((await inspectPlugins([bytes("plugin_example")])).opcodes).toEqual(
        expect.arrayContaining([
            { opname: "mult.aa", outypes: "a", intypes: "aa" },
            { opname: "mult.kk", outypes: "k", intypes: "kk" },
            { opname: "mult.ii", outypes: "i", intypes: "ii" }
        ])
    );
    expect(
        (await inspectPlugins([bytes("plugin_example_cpp")])).opcodes
    ).toEqual([{ opname: "hello440", outypes: "a", intypes: "" }]);
    await expect(inspectPlugins([new Uint8Array([1, 2, 3])])).rejects.toThrow(
        "Invalid"
    );
    // A valid command module is not an opcode plugin; a failed load is not an empty success.
    await expect(inspectPlugins([bytes("csbeats")])).rejects.toThrow();
});
it.skipIf(!existsSync(".wasm-build/csound-check.wasm"))(
    "uses real plugin signatures for argument checks and removes them on the next request",
    async () => {
        const module = await WebAssembly.compile(
            readFileSync(".wasm-build/csound-check.wasm")
        );
        const plugins = await inspectPlugins([
            bytes("plugin_example"),
            bytes("plugin_example_cpp")
        ]);
        const run = (text: string, signatures = plugins) =>
            runCheck(module, {
                filename: "main.orc",
                files: [{ name: "main.orc", text }],
                plugins: signatures.opcodes,
                pluginTypes: signatures.types
            });
        const valid = await run(
            "instr 1\na1 = hello440()\na2 = mult(a1, a1)\ni1 = mult(2, 3)\nendin\n"
        );
        expect(valid.status, valid.log).toBe(0);
        const wrong = await run("instr 1\na1 = hello440(123)\nendin\n");
        expect(wrong.valid, wrong.log).toBe(false);
        expect(
            wrong.diagnostics.some((item) => item.message.includes("hello440"))
        ).toBe(true);
        const broken = await run("instr 1\na1 = mult(0.1, )\nendin\n");
        expect(broken.diagnostics).toHaveLength(1);
        expect(broken.diagnostics[0].message).toContain("unexpected");
        const removed = await run("instr 1\na1 = hello440()\nendin\n", {
            opcodes: [],
            types: []
        });
        expect(removed.valid).toBe(false);
        expect(removed.diagnostics[0].message).toContain(
            "unable to find opcode"
        );
    }
);

it.skipIf(!existsSync(".wasm-build/plugin-types-fixture.wasm"))(
    "checks real plugin object and struct types without importing their constructors",
    async () => {
        const reader = new Uint8Array(
            readFileSync(".wasm-build/plugin-types.wasm")
        );
        const fixture = new Uint8Array(
            readFileSync(".wasm-build/plugin-types-fixture.wasm")
        );
        const metadata = await inspectPlugins([fixture], reader);
        expect(metadata.types).toEqual(
            expect.arrayContaining([
                { name: "PluginVoice", argtype: 0, struct: false, members: [] },
                {
                    name: ":PluginPair;",
                    argtype: 0,
                    struct: true,
                    members: [
                        { name: "level", type: "k", dimensions: 0 },
                        { name: "notes", type: "i", dimensions: 1 }
                    ]
                }
            ])
        );
        const module = await WebAssembly.compile(
            readFileSync(".wasm-build/csound-check.wasm")
        );
        const run = (body: string, types = metadata.types) =>
            runCheck(module, {
                filename: "types.orc",
                plugins: metadata.opcodes,
                pluginTypes: types,
                files: [
                    { name: "types.orc", text: `instr 1\n${body}\nendin\n` }
                ]
            });
        const body = `voice:PluginVoice = plugin_voice(1)\nk1 = plugin_read(voice)\npair:PluginPair = plugin_pair()\nk2 = pair.level\ni1 = pair.notes[0]`;
        const valid = await run(body);
        expect(valid.status, valid.log).toBe(0);
        const wrongMember = await run(
            body.replace("pair.level", "pair.missing")
        );
        expect(wrongMember.valid, wrongMember.log).toBe(false);
        expect(wrongMember.log).toContain("missing");
        const wrongType = await run(
            body.replace("plugin_read(voice)", "plugin_read(123)")
        );
        expect(wrongType.valid, wrongType.log).toBe(false);
        expect(wrongType.log).toContain("plugin_read");
        const removed = await run(body, []);
        expect(removed.valid, removed.log).toBe(false);
        expect((await inspectPlugins([], reader)).types).toEqual([]);
    }
);
