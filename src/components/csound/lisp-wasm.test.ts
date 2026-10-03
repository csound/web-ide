// @vitest-environment node
import { expect, it, vi } from "vitest";
import { evaluateLisp } from "./lisp";

it("calls a project-supplied LispEval once per region in the browser engine", async () => {
    vi.stubGlobal("self", globalThis);
    vi.stubGlobal("window", globalThis);
    const { libcsound } = await import("@csound/browser");
    const api = await libcsound();
    const instance = api.csoundCreate();
    const engine = {
        evalCode: async (source: string) =>
            api.csoundEvalCode(instance, source),
        setStringChannel: async (name: string, source: string) => {
            api.csoundSetStringChannel(instance, name, source);
        }
    };
    try {
        api.csoundSetOption(instance, "-n");
        api.csoundSetOption(instance, "-d");
        api.csoundSetOption(instance, "--daemon");
        expect(
            api.csoundCompileOrc(
                instance,
                `
sr = 44100
ksmps = 32
nchnls = 2
0dbfs = 1
calls@global:i init 0
opcode LispEval(source:S):i
  calls += 1
  chnset calls, "calls"
  chnset source, "received"
  status:i = strcmp(source, "bad") == 0 ? 1 : 0
  xout status
endop
`
            )
        ).toBe(0);
        expect(api.csoundStart(instance)).toBe(0);
        const sources = [
            "(+ 1 2)",
            '(println "hélló")\n; $MACRO {{ }} \\',
            "bad",
            "(+ 3 4)"
        ];
        for (const [index, source] of sources.entries()) {
            expect(await evaluateLisp(engine, source)).toBe(
                source === "bad" ? -1 : 0
            );
            expect(api.csoundGetStringChannel(instance, "received")).toBe(
                source
            );
            expect(api.csoundGetControlChannel(instance, "calls")).toBe(
                index + 1
            );
        }
    } finally {
        api.csoundDestroy(instance);
        vi.unstubAllGlobals();
    }
});
