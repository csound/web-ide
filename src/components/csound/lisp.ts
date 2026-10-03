import type { CsoundObj } from "./types";

type LispEngine = Pick<CsoundObj, "evalCode" | "setStringChannel">;
export const LISP_SOURCE_CHANNEL = "__web_ide_lisp_source";
const pending = new WeakMap<LispEngine, Promise<number>>();

/** The project's include supplies LispEval(source:S):i and owns its state. */
export function evaluateLisp(
    csound: LispEngine,
    source: string
): Promise<number> {
    const previous = pending.get(csound) ?? Promise.resolve(0);
    const evaluation = previous
        .catch(() => undefined)
        .then(async () => {
            // Source is data, including quotes, newlines, Unicode and Csound macros.
            // Serialize writes and reads so quick evals cannot replace each other.
            await csound.setStringChannel(LISP_SOURCE_CHANNEL, source);
            // evalCode also returns zero on compile errors (including a missing
            // LispEval). Reserve 1 for success so those failures blink red.
            const result = await csound.evalCode(
                `return (LispEval(chnget:S("${LISP_SOURCE_CHANNEL}")) == 0 ? 1 : -1)\n`
            );
            return result === 1 ? 0 : -1;
        });
    pending.set(csound, evaluation);
    return evaluation;
}
