import { curry, isNil, propOr } from "ramda";

const findOrcBlock = (editorReference) => {
    const value = editorReference
        ? (editorReference as any)?.doc?.getValue()
        : "";
    const lines = value.split("\n");
    const cursorLine = editorReference
        ? propOr(0, "line", editorReference.getCursor())
        : 0;

    const currentLineEndOfBound = uncommentLine(lines[cursorLine]).match(
        /endin|endop/g
    );

    const cursorBoundry = Math.min(
        cursorLine +
            (currentLineEndOfBound && currentLineEndOfBound.length > 0 ? 0 : 1),
        lines.length
    );

    let lastBlockLine, lineNumber;

    for (lineNumber = 0; lineNumber < cursorBoundry; lineNumber++) {
        const line = uncommentLine(lines[lineNumber]);
        if (/instr|opcode/g.test(line)) {
            lastBlockLine = lineNumber;
        } else if (/endin|endop/g.test(line)) {
            lastBlockLine = undefined;
        }
    }

    if (isNil(lastBlockLine)) {
        return {
            from: { line: cursorLine, ch: 0 },
            to: { line: cursorLine, ch: lines[cursorLine].length },
            evalStr: lines[cursorLine]
        };
    }

    let blockEnd;

    for (lineNumber = cursorLine; lineNumber < lines.length + 1; lineNumber++) {
        if (blockEnd) {
            break;
        }
        const line = uncommentLine(lines[lineNumber]);

        if (/endin|endop/g.test(line)) {
            blockEnd = lineNumber;
        }
    }
    return !blockEnd
        ? {
              from: { line: cursorLine, ch: 0 },
              to: { line: cursorLine, ch: lines[cursorLine - 1].length },
              evalStr: lines[cursorLine]
          }
        : {
              from: { line: lastBlockLine, ch: 0 },
              to: { line: blockEnd, ch: lines[blockEnd].length },
              evalStr: lines.slice(lastBlockLine, blockEnd + 1).join("\n")
          };
};

export const editorEvalCode = curry(
    (
        csound,
        csoundStatus,
        documentType,
        editorInstance,
        blockEval: boolean
    ) => {
        if (csoundStatus !== "playing") {
            return;
        } else if (editorInstance) {
            // selection takes precedence
            const selection = editorInstance.getSelection();
            const cursor = editorInstance.getCursor();
            let markerCallback;
            let evalString = "";
            // let csdLoc: "orc" | "sco" | null = null;

            if (!blockEval) {
                const line = editorInstance.getLine(cursor.line);
                evalString = isNil(selection) ? line : selection;
                markerCallback = (hasError) => {
                    const textMarker = editorInstance.markText(
                        { line: cursor.line, ch: 0 },
                        { line: cursor.line, ch: line.length },
                        {
                            className: hasError ? "blinkEvalError" : "blinkEval"
                        }
                    );
                    setTimeout(() => textMarker.clear(), 200);
                };
            } else {
                let result;
                if (documentType === "orc" || documentType === "udo") {
                    result = findOrcBlock(editorInstance);
                } else if (documentType === "sco") {
                    // FIXME
                    result = {
                        from: { line: cursor.line, ch: 0 },
                        to: {
                            line: cursor.line,
                            ch: editorInstance.getLine(cursor.line).length
                        },
                        evalStr: editorInstance.getLine(cursor.line)
                    };
                }
                if (result) {
                    if (!result) {
                        return;
                    }
                    evalString = result.evalStr;
                    markerCallback = (hasError) => {
                        const textMarker = editorInstance.markText(
                            result.from,
                            result.to,
                            {
                                className: hasError
                                    ? "blinkEvalError"
                                    : "blinkEval"
                            }
                        );
                        setTimeout(() => textMarker.clear(), 200);
                    };
                }
            }
            if (isNil(evalString)) {
                return;
            }
            /* eslint-disable-next-line unicorn/prefer-switch */
            if (documentType === "orc" || documentType === "udo") {
                csound &&
                    csound.evalCode(evalString).then((result) => {
                        markerCallback && markerCallback(result !== 0);
                    });
            } else if (documentType === "sco") {
                csound && csound.readScore(evalString);
            } else if (documentType === "csd") {
                csound &&
                    csound.evalCode(evalString).then((result) => {
                        markerCallback && markerCallback(result !== 0);
                    });
            }
        }
    }
);

export const uncommentLine = (line: string): string => {
    let uncommentedLine: any = line.split(";");
    if (uncommentedLine.length > 1) {
        uncommentedLine = uncommentedLine[0];
    } else {
        uncommentedLine = uncommentedLine[0].split("//");
        uncommentedLine = uncommentedLine[0];
    }
    return uncommentedLine;
};
