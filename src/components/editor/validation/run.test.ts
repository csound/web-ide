// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { beforeAll, expect, it } from "vitest";
import { runCheck } from "./run";
import { orchestra } from "./source";
import { Text } from "@codemirror/state";
import { editorDiagnostics } from "./ranges";
const artifact = ".wasm-build/csound-check.wasm";
const available = existsSync(artifact);
let module: WebAssembly.Module;
beforeAll(async () => {
    if (available) module = await WebAssembly.compile(readFileSync(artifact));
});
const check = (text: string) =>
    runCheck(module, {
        filename: "main.orc",
        files: [{ name: "main.orc", text }]
    });

const after = "opcode After(freq:i):a\nxout oscili(0.1, freq)\nendop\n";
const unknownNames = (result: Awaited<ReturnType<typeof check>>) =>
    result.diagnostics.filter((item) =>
        item.message.startsWith("Unknown opcode:")
    );
it.skipIf(!available)(
    "marks an unknown call even when its arguments have a syntax error",
    async () => {
        const text = "instr 1\n  aSignal = osciliii(0.1, )\nendin\n";
        const result = await check(text);
        const doc = Text.of(text.split("\n"));
        const diagnostics = editorDiagnostics(doc, result.diagnostics);
        expect(
            diagnostics.map((item) => doc.sliceString(item.from, item.to))
        ).toEqual([")", "osciliii"]);
        expect(diagnostics[1].message).toBe("Unknown opcode: osciliii");
        expect(result.valid).toBe(false);
    }
);
it.skipIf(!available).each([
    ["a1 = misspelled:a(0.1, )", "misspelled"],
    ["\ta1 = misspelled(\n0.1, )", "misspelled"],
    ['S1 = sprintf("ö😀", misspelled(,))', "misspelled"]
])("locates unknown names in %s", async (line, name) => {
    const text = `instr 1\n${line}\nendin\n`;
    const result = await check(text);
    const doc = Text.of(text.split("\n"));
    expect(
        editorDiagnostics(doc, unknownNames(result)).map((item) =>
            doc.sliceString(item.from, item.to)
        )
    ).toEqual([name]);
});

it.skipIf(!available)(
    "checks active includes and later declarations without reading comments or strings",
    async () => {
        const result = await runCheck(module, {
            filename: "song/main.orc",
            files: [
                { name: "song/main.orc", text: '#include "voice.udo"\n' },
                {
                    name: "song/voice.udo",
                    text: `instr 1
; commentOnly(,)
S1 = "stringOnly(,)"
S2 = {{ rawOnly(,) }}
#ifdef DISABLED
a1 = inactiveOnly(,)
#endif
a1 = After(0.1, )
a2 = typoInInclude(0.1, )
endin
${after}`
                }
            ]
        });
        expect(unknownNames(result)).toEqual([
            expect.objectContaining({
                filename: "song/voice.udo",
                line: 9,
                message: "Unknown opcode: typoInInclude"
            })
        ]);
    }
);

it.skipIf(!available)(
    "does not mistake constructors or opcode references for unknown opcodes",
    async () => {
        const result = await check(`struct Voice frequency:i
instr 1
osc:Opcode = oscili
a1 = osc(0.1, )
voice:Voice = Voice(440, )
a2 = genuinelyMissing(,)
endin
`);
        expect(unknownNames(result).map((item) => item.message)).toEqual([
            "Unknown opcode: genuinelyMissing"
        ]);
    }
);

it.skipIf(!available)(
    "retains confirmed UDO names and reports other unknown calls on the same line",
    async () => {
        const text = "instr 1\na1 = Kept(0.1, missOne(missTwo(,)))\nendin\n";
        const result = await runCheck(module, {
            filename: "main.orc",
            files: [{ name: "main.orc", text }],
            knownOpcodes: ["Kept"]
        });
        expect(unknownNames(result).map((item) => item.message)).toEqual([
            "Unknown opcode: missOne",
            "Unknown opcode: missTwo"
        ]);
        const doc = Text.of(text.split("\n"));
        expect(
            editorDiagnostics(doc, unknownNames(result)).map((item) =>
                doc.sliceString(item.from, item.to)
            )
        ).toEqual(["missOne", "missTwo"]);
    }
);

it.skipIf(!available)(
    "does not duplicate an unknown-opcode error from semantic checks",
    async () => {
        const result = await check("instr 1\na1 = osciliii(0.1, 440)\nendin\n");
        expect(result.diagnostics).toHaveLength(1);
        expect(result.diagnostics[0].message).toContain("osciliii");
    }
);

it.skipIf(!available)(
    "skips extra name errors when recovery cannot reach later declarations",
    async () => {
        const result = await check(
            "a1 = After(, )\n" + "a1 = )\n".repeat(30) + after
        );
        expect(result.valid).toBe(false);
        expect(unknownNames(result)).toEqual([]);
    }
);

it.skipIf(!available)(
    "skips extra name errors when the identifier set reaches its cap",
    async () => {
        const text = Array.from(
            { length: 8192 },
            (_, i) => `iVar${i} = 0\n`
        ).join("");
        const result = await check(
            text + "instr 1\na1 = misspelled(, )\nendin\n"
        );
        expect(result.valid).toBe(false);
        expect(unknownNames(result)).toEqual([]);
    }
);
it
    .skipIf(!available)
    .each([
        "a1 = oscili(0.1, )\nxout a1\nendop\n",
        "a1 = oscili(\nendop\n",
        "if 1 == 1 then\nxout 0\nendop\n",
        "xout 0\n"
    ])("keeps UDO headers before and after a broken body: %s", async (body) => {
    const result = await check(`opcode Broken(freq:i):a\n${body}${after}`);
    expect(result.status, result.log).toBe(1);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.udos?.map((udo) => udo.name)).toEqual(["Broken", "After"]);
    expect(result.udos?.[1]).toMatchObject({
        inputs: [{ name: "freq", type: "i" }],
        outputs: ["a"]
    });
});

it.skipIf(!available)(
    "skips an unfinished header and bounds recovery",
    async () => {
        const incomplete = await check(`opcode Unfinished(\nendop\n${after}`);
        expect(incomplete.status).toBe(1);
        expect(incomplete.udos?.map((udo) => udo.name)).toEqual(["After"]);
        const repeated = await check("a1 = )\n".repeat(200) + after);
        expect(repeated.status).toBe(1);
        expect(repeated.diagnostics.length).toBeLessThanOrEqual(20);
    }
);

it.skipIf(!available)(
    "gets UDOs from active nested includes, even with syntax errors",
    async () => {
        const result = await runCheck(module, {
            filename: "song/main.orc",
            files: [
                { name: "song/main.orc", text: '#include "voices/lead.udo"\n' },
                {
                    name: "song/voices/lead.udo",
                    text: '#include "helper.udo"\n'
                },
                {
                    name: "song/voices/helper.udo",
                    text: `#ifdef DISABLED\nopcode Hidden():a\nxout 0\nendop\n#endif\n#define NAME #IncludedVoice#\nopcode $NAME (freq:i):a\na1 = oscili(0.1, )\nxout a1\nendop\n${after}`
                },
                {
                    name: "unused.udo",
                    text: "opcode Unused():a\nxout 0\nendop\n"
                }
            ]
        });
        expect(result.status, result.log).toBe(1);
        expect(result.udos?.map((udo) => udo.name)).toEqual([
            "IncludedVoice",
            "After"
        ]);
        expect(
            result.udos?.every(
                (udo) => udo.filename === "song/voices/helper.udo"
            )
        ).toBe(true);
    }
);

it.skipIf(!available)(
    "does not call a capped declaration list complete",
    async () => {
        const text = Array.from(
            { length: 2049 },
            (_, index) =>
                `opcode Voice${index}(freq:i):a\nxout oscili(0.1, freq)\nendop\n`
        ).join("");
        const result = await check(text);
        expect(result.status, result.log).toBe(0);
        expect(result.valid).toBe(true);
        expect(result.udos).toHaveLength(2048);
        expect(result.udosComplete).toBe(false);
    }
);

it.skipIf(!available)(
    "returns fresh signatures after edits and deletions",
    async () => {
        expect((await check(after)).udos?.[0].name).toBe("After");
        const changed = await check(
            "opcode Changed(values:Complex[]):Complex[]\nxout values\nendop\n"
        );
        expect(changed.status, changed.log).toBe(0);
        expect(changed.udos).toEqual([
            {
                filename: "main.orc",
                line: 1,
                name: "Changed",
                inputs: [{ name: "values", type: "Complex[]" }],
                outputs: ["Complex[]"]
            }
        ]);
        expect((await check("; deleted\n")).udos).toEqual([]);
    }
);

it.skipIf(!available)(
    "exports classic, multiline and overloaded signatures before semantic errors",
    async () => {
        const result = await check(
            `opcode Classic, a, ik\niFreq, kAmp xin\nxout oscili(kAmp, iFreq)\nendop\nopcode Multi(\n  freq:i,\n  gain:k\n):\n(a, k)\na1 = oscili(gain, freq)\nxout a1, gain\nendop\nopcode Multi(freq:i):a\nxout noSuchOpcode(freq)\nendop\n`
        );
        expect(result.status, result.log).toBe(1);
        expect(
            result.udos?.map((udo) => [udo.name, udo.inputs, udo.outputs])
        ).toEqual([
            [
                "Classic",
                [
                    { name: "", type: "i" },
                    { name: "", type: "k" }
                ],
                ["a"]
            ],
            [
                "Multi",
                [
                    { name: "freq", type: "i" },
                    { name: "gain", type: "k" }
                ],
                ["a", "k"]
            ],
            ["Multi", [{ name: "freq", type: "i" }], ["a"]]
        ]);
    }
);
it.skipIf(!available).each([
    ["  aSignal = oscili(0.1, )", ")"],
    ["\ta1 = oscili(0.1, )", ")"],
    ['S1 = sprintf("ö😀", )', ")"],
    ["  a1 = oscili(0.1, 440) invalid", "invalid"],
    ["a1 = noSuchOpcode(440)", "noSuchOpcode"]
])("underlines the token in %s", async (line, token) => {
    const text = `instr 1\n${line}\nendin\n`;
    const result = await check(text);
    const doc = Text.of(text.split("\n"));
    const [diagnostic] = editorDiagnostics(doc, result.diagnostics);
    expect(diagnostic, result.log).toBeDefined();
    expect(doc.sliceString(diagnostic.from, diagnostic.to)).toBe(token);
    expect(diagnostic.message).not.toMatch(/line \d|columns? \d/);
    expect(diagnostic.source).toBeUndefined();
});
it.skipIf(!available)(
    "accepts valid modern syntax and never runs global code",
    async () => {
        const result = await check(
            'prints "MUST NOT RUN"\ninstr 1\na1 = oscili(0.1, 440)\nendin\n'
        );
        expect(result).toMatchObject({
            available: true,
            status: 0,
            diagnostics: []
        });
        expect(result.log).not.toContain("MUST NOT RUN");
    }
);
it.skipIf(!available)(
    "locates a syntax error and remains clean on the next check",
    async () => {
        const result = await check("instr 1\na1 = oscili(0.1, )\nendin\n");
        expect(result.diagnostics).toEqual([
            expect.objectContaining({ filename: "main.orc", line: 2 })
        ]);
        expect(
            (await check("instr 1\na1 = oscili(0.1, 440)\nendin\n")).diagnostics
        ).toEqual([]);
    }
);
it.skipIf(!available)("checks included source files", async () => {
    const result = await runCheck(module, {
        filename: "main.orc",
        files: [
            {
                name: "main.orc",
                text: '#include "voice.udo"\ninstr 1\na1 Voice 440\nendin\n'
            },
            {
                name: "voice.udo",
                text: "opcode Voice, a, i\niFreq xin\na1 oscili 0.1, iFreq\nxout a1\nendop\n"
            }
        ]
    });
    expect(result.status).toBe(0);
    expect(result.diagnostics).toEqual([]);
});

it.skipIf(!available)(
    "accepts arrays, Complex types, and typed UDOs",
    async () => {
        const result = await check(`opcode Voice(freq:i):a
      xout oscili(0.1, freq)
    endop
    instr 1
      values:k[] = [1, 2, 3, 4]
      spectrum:Complex[] = fft(values)
      a1 = Voice(440)
    endin
`);
        expect(result.status, result.log).toBe(0);
    }
);
it.skipIf(!available)(
    "reports semantic errors and keeps include filenames",
    async () => {
        const result = await check("instr 1\na1 = noSuchOpcode(440)\nendin\n");
        expect(result.status).toBe(1);
        expect(result.diagnostics.length).toBeGreaterThan(0);
        const included = await runCheck(module, {
            filename: "main.orc",
            files: [
                { name: "main.orc", text: '#include "bad.udo"\n' },
                {
                    name: "bad.udo",
                    text: "opcode Voice, a, i\na1 = oscili(0.1, )\nxout a1\nendop\n"
                }
            ]
        });
        expect(included.diagnostics).toEqual([
            expect.objectContaining({ filename: "bad.udo", line: 2 })
        ]);
    }
);

it.skipIf(!available)(
    "keeps CSD line numbers and resolves nested includes",
    async () => {
        const csd = `<CsoundSynthesizer>
<CsOptions>
--eval-code="this must not run"
</CsOptions>
<CsInstruments>
#include "voices/lead.udo"
instr 1
a1 = oscili(0.1, )
endin
</CsInstruments>
<CsScore bin="csbeats">also not orchestra code</CsScore>
</CsoundSynthesizer>`;
        const result = await runCheck(module, {
            filename: "song/main.csd",
            files: [
                {
                    name: "song/main.csd",
                    text: orchestra(csd, "song/main.csd")!
                },
                {
                    name: "song/voices/lead.udo",
                    text: '#include "helper.udo"\n'
                },
                {
                    name: "song/voices/helper.udo",
                    text: "; included from the same folder\n"
                }
            ]
        });
        expect(result.status, result.log).toBe(1);
        expect(result.log).not.toMatch(
            /cannot open|cannot find|Failed to open/i
        );
        expect(result.diagnostics, result.log).toEqual([
            expect.objectContaining({ filename: "song/main.csd", line: 8 })
        ]);
    }
);

it.skipIf(!available)(
    "handles Unicode filenames and reports errors in a nested include",
    async () => {
        const result = await runCheck(module, {
            filename: "söngur/main.orc",
            files: [
                {
                    name: "söngur/main.orc",
                    text: '#include "voices/lead.udo"\n'
                },
                {
                    name: "söngur/voices/lead.udo",
                    text: "instr 1\na1 = oscili(0.1, )\nendin\n"
                }
            ]
        });
        expect(result.status, result.log).toBe(1);
        expect(result.diagnostics).toEqual([
            expect.objectContaining({
                filename: "söngur/voices/lead.udo",
                line: 2
            })
        ]);
    }
);

it.skipIf(!available)(
    "checks Csound object signatures without creating an engine",
    async () => {
        const result = await check(
            'instr 1\ncs:Csound = create()\nerr:i = setoption(cs, "-n")\ndelete(cs)\nendin\n'
        );
        expect(result.status, result.log).toBe(0);
    }
);

it.skipIf(!available)(
    "reserves UTF-8 argv space for non-ASCII filenames",
    async () => {
        const filename = "音😀".repeat(30) + ".orc";
        const result = await runCheck(module, {
            filename,
            files: [{ name: filename, text: "instr 1\nprint 1\nendin\n" }]
        });
        expect(result.valid, result.log).toBe(true);
        const invalid = await runCheck(module, {
            filename,
            files: [
                { name: filename, text: "instr 1\na1 = oscili(, )\nendin\n" }
            ]
        });
        expect(invalid.diagnostics).toContainEqual(
            expect.objectContaining({ filename, line: 2 })
        );
    }
);
