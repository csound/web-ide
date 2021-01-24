import { curry } from "ramda";
import { isEmpty } from "lodash";

export const editorEvalCode = curry(
    (
        csound,
        csoundStatus,
        documentType,
        printToConsole,
        findOrcBlock,
        editorReference,
        blockEval: boolean
    ) => {
        if (csoundStatus !== "playing") {
            printToConsole && printToConsole("Csound isn't running!");
        } else if (editorReference) {
            // selection takes precedence
            const selection = editorReference.getSelection();
            const cursor = editorReference.getCursor();
            let markerCallback;
            let evalString = "";
            // let csdLoc: "orc" | "sco" | null = null;

            if (!blockEval) {
                const line = editorReference.getLine(cursor.line);
                evalString = isEmpty(selection) ? line : selection;
                markerCallback = (hasError) => {
                    const textMarker = editorReference.markText(
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
                    result = findOrcBlock();
                } else if (documentType === "sco") {
                    // FIXME
                    result = {
                        from: { line: cursor.line, ch: 0 },
                        to: {
                            line: cursor.line,
                            ch: editorReference.getLine(cursor.line).length
                        },
                        evalStr: editorReference.getLine(cursor.line)
                    };
                }
                if (result) {
                    if (!result) {
                        return;
                    }
                    evalString = result.evalStr;
                    markerCallback = (hasError) => {
                        const textMarker = editorReference.markText(
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
            if (isEmpty(evalString)) {
                return;
            }
            if (documentType === "orc" || documentType === "udo") {
                csound &&
                    csound.evaluateCodePromise(evalString).then((result) => {
                        markerCallback && markerCallback(result !== 0);
                    });
            } else if (documentType === "sco") {
                csound && csound.readScore(evalString);
            } else if (documentType === "csd") {
                csound &&
                    csound.evaluateCodePromise(evalString).then((result) => {
                        markerCallback && markerCallback(result !== 0);
                    });
            } else {
                printToConsole &&
                    printToConsole("Can't evaluate non-csound documents!");
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
