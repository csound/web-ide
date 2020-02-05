import { curry } from "ramda";
import { isEmpty } from "lodash";

export const editorEvalCode = curry(
    (
        csound,
        csoundStatus,
        documentType,
        printToConsole,
        findOrcBlock,
        editorRef,
        blockEval: boolean
    ) => {
        if (csoundStatus !== "playing") {
            printToConsole && printToConsole("Csound isn't running!");
        } else if (editorRef) {
            // selection takes precedence
            const selection = editorRef.getSelection();
            const cursor = editorRef.getCursor();
            let markerCallback;
            let evalStr = "";
            // let csdLoc: "orc" | "sco" | null = null;

            if (!blockEval) {
                const line = editorRef.getLine(cursor.line);
                evalStr = isEmpty(selection) ? line : selection;
                markerCallback = hasError => {
                    const textMarker = editorRef.markText(
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
                            ch: editorRef.getLine(cursor.line).length
                        },
                        evalStr: editorRef.getLine(cursor.line)
                    };
                }
                if (!!result) {
                    evalStr = result!.evalStr;
                    markerCallback = hasError => {
                        const textMarker = editorRef.markText(
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
            if (isEmpty(evalStr)) return;
            if (documentType === "orc" || documentType === "udo") {
                csound &&
                    csound.evaluateCodePromise(evalStr).then(res => {
                        markerCallback && markerCallback(res !== 0);
                    });
            } else if (documentType === "sco") {
                csound && csound.readScore(evalStr);
            } else if (documentType === "csd") {
                csound &&
                    csound.evaluateCodePromise(evalStr).then(res => {
                        markerCallback && markerCallback(res !== 0);
                    });
            } else {
                printToConsole &&
                    printToConsole("Can't evaluate non-csound documents!");
            }
        }
    }
);
