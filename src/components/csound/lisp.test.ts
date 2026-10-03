import { describe, expect, it, vi } from "vitest";
import { evaluateLisp, LISP_SOURCE_CHANNEL } from "./lisp";

function engine() {
    return {
        evalCode: vi.fn(async (_source: string) => 1),
        setStringChannel: vi.fn(
            async (_name: string, _source: string) => undefined
        )
    };
}

describe("Lisp evaluation entry point", () => {
    it("passes source as data and calls the project's opcode", async () => {
        const csound = engine();
        const source =
            String.raw`(println "hélló \"world\" $MACRO {{ }}")` + "\n(+ 1 2)";
        expect(await evaluateLisp(csound, source)).toBe(0);
        expect(csound.setStringChannel).toHaveBeenCalledWith(
            LISP_SOURCE_CHANNEL,
            source
        );
        expect(csound.evalCode).toHaveBeenCalledWith(
            'return (LispEval(chnget:S("__web_ide_lisp_source")) == 0 ? 1 : -1)\n'
        );
    });
    it("keeps rapid evaluations in order", async () => {
        const csound = engine();
        const seen: string[] = [];
        let channel = "";
        csound.setStringChannel.mockImplementation(async (_name, source) => {
            channel = source;
        });
        csound.evalCode.mockImplementation(async () => {
            await Promise.resolve();
            seen.push(channel);
            return 1;
        });
        await Promise.all([
            evaluateLisp(csound, "first"),
            evaluateLisp(csound, "second")
        ]);
        expect(seen).toEqual(["first", "second"]);
    });
    it.each([0, -1, Number.NaN])(
        "reports compiler or evaluator failure: %s",
        async (result) => {
            const csound = engine();
            csound.evalCode.mockResolvedValueOnce(result);
            expect(await evaluateLisp(csound, "bad")).toBe(-1);
            expect(await evaluateLisp(csound, "good")).toBe(0);
        }
    );
    it("does not block later evaluations after a rejected engine call", async () => {
        const csound = engine();
        csound.evalCode.mockRejectedValueOnce(new Error("engine failure"));
        await expect(evaluateLisp(csound, "bad")).rejects.toThrow(
            "engine failure"
        );
        expect(await evaluateLisp(csound, "good")).toBe(0);
    });
});
