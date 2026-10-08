import { runTool } from "../audio-tools/runner";
import type { ToolRequest, ToolResult } from "../audio-tools/types";
import type { ScoreProgram } from "./programs";

export const scoreExamples: Record<ScoreProgram, string> = {
    csbeats: "i1 m1 b1 C4 q mf\ni1 b2 D4 q mf\ni1 b3 E4 q mf\ni1 b4 F4 q mf\n",
    scot: "orchestra { voice=1 }\n\nscore {\n  $voice\n  4c d e f\n}\n",
    scsort: "i1 2 1 440\ni1 0 1 220\ni1 1 1 330\ne\n",
    extract: "i1 0 1 220\ni2 1 1 330\ni1 2 1 440\ne\n"
};

export type ScoreConversion = {
    program: ScoreProgram;
    source: string;
    selection: string;
};

export function scoreRequest({
    program,
    source,
    selection
}: ScoreConversion): ToolRequest {
    const encode = (text: string) =>
        new TextEncoder().encode(text.endsWith("\n") ? text : text + "\n");
    const data = encode(source);
    if (data.length > 1024 * 1024)
        throw new Error("Use a score smaller than 1 MB.");
    const files = [{ name: "input.txt", data }];
    if (program === "extract") {
        if (selection.length > 4096)
            throw new Error("Use a shorter selection.");
        // The native reader assumes valid numbers. Reject malformed controls before entering WASM.
        if (
            !/^(?:\s*(?:i(?:\s+\d+)+|[ft]\s+\d+:\d+(?:\.\d+)?))*\s*$/.test(
                selection
            ) ||
            !selection.trim()
        )
            throw new Error(
                "Use i followed by instrument numbers, and f or t followed by section:beat (for example, i 1 or f 1:0 t 1:4)."
            );
        files.push({ name: "selection.txt", data: encode(selection) });
    }
    const stdin = program === "scsort" || program === "extract";
    return {
        tool: program,
        files,
        args: stdin
            ? program === "extract"
                ? ["selection.txt"]
                : []
            : ["input.txt", "output.sco"],
        stdin: stdin ? "input.txt" : undefined,
        output: stdin ? "stdout" : "output.sco"
    };
}

export function scoreResult(program: ScoreProgram, result: ToolResult) {
    // SCOT reports recoverable parse errors on stderr but exits successfully.
    if (
        (program === "scot" &&
            /scot:\s*[1-9]\d* errors?\b/i.test(result.log)) ||
        /\b(?:syntax error\b|error:|error in score\b|illegal opcode\b|sread:\s*(?:unexpected|illegal|error))/i.test(
            result.log
        )
    )
        throw new Error(result.log.trim());
    if (result.data.byteLength > 8 * 1024 * 1024)
        throw new Error(
            "The generated score is too large to display (over 8 MB)."
        );
    return {
        text:
            program === "scsort" || program === "extract"
                ? decimalScore(new TextDecoder().decode(result.data))
                : new TextDecoder().decode(result.data),
        log: result.log.trim()
    };
}

/** The sorter writes C hex floats, which the score preprocessor cannot read back. */
export function decimalScore(source: string): string {
    // Keep quoted p-fields intact, including text that happens to look like a number.
    return source.replace(
        /"(?:[^"\\]|\\.)*"|(?<!\S)([+-]?)0x([\da-f]+)(?:\.([\da-f]*))?p([+-]?\d+)(?!\S)/gi,
        (
            token,
            sign: string | undefined,
            whole: string,
            fraction: string | undefined,
            exponent: string
        ) => {
            if (sign === undefined) return token;
            const mantissa =
                Number.parseInt(whole, 16) +
                (fraction
                    ? Number.parseInt(fraction, 16) / 16 ** fraction.length
                    : 0);
            const value = mantissa * 2 ** Number(exponent);
            return (sign === "-" ? "-" : "") + String(value);
        }
    );
}

export async function convertScore(
    request: ScoreConversion,
    signal: AbortSignal,
    status: (text: string) => void
) {
    signal.throwIfAborted();
    const command = scoreRequest(request);
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener("abort", abort, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, 30000);
    try {
        if (request.program === "extract") {
            const sorted = scoreResult(
                "scsort",
                await runTool(
                    scoreRequest({ ...request, program: "scsort" }),
                    controller.signal,
                    status
                )
            );
            command.files[0].data = new TextEncoder().encode(sorted.text);
        }
        return scoreResult(
            request.program,
            await runTool(command, controller.signal, status)
        );
    } catch (error) {
        if (timedOut)
            throw new Error(
                "Conversion took too long. Check the source or try a smaller score."
            );
        throw error;
    } finally {
        clearTimeout(timer);
        signal.removeEventListener("abort", abort);
    }
}
