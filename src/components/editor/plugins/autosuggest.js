import * as CodeMirror from "codemirror";
import "./show-hint";
import synopsis from "csound-manual-react/lib/manual/synopsis";
import { append, take, propOr, reduce, reject } from "ramda";
import Fuse from "fuse.js";

const opcodes = reject(
    (s) => s.includes("(") || s.includes(")"),
    Object.keys(synopsis)
);

const fuzzyMatcher = new Fuse(opcodes, {
    shouldSort: false,
    caseSensitive: true,
    threshold: 0.1,
    distance: 10
});

async function hintFunction(cm, callback) {
    const cursor = cm.getDoc().getCursor();
    const tokenData = cm.getTokenAt(cursor);
    const token = propOr(false, "string", tokenData);
    if (
        !token ||
        cursor.ch !== tokenData.end ||
        token.length < 3 ||
        tokenData.type === "comment"
    ) {
        return;
    }

    const start = tokenData.start;
    const end = tokenData.end;
    const results = take(50, fuzzyMatcher.search(token));
    // if there are no matching results or it's the only result
    // and the token matches the suggestion perfectly, there's no
    // reason to display the suggestions list
    if (
        results.length === 0 ||
        (results.length === 1 && results[0].item === token)
    ) {
        return;
    }

    const list = reduce(
        (accumulator, result) =>
            append(
                {
                    className: "",
                    text: result.item,
                    displayText: result.item,
                    from: CodeMirror.Pos(cursor.line, start),
                    to: CodeMirror.Pos(cursor.line, end)
                },
                accumulator
            ),
        [],
        results
    );
    typeof callback === "function" &&
        callback({
            list
        });
    // return { list };
    return cm;
    // cm.on("pick", codeMirr => {
    //     console.log("END COMP", codeMirr);
    //     codeMirr.on("pick", (x, y, z) => console.log("PICK", x, y, z));
    // });
}

hintFunction.async = true;

CodeMirror.defineOption("autoSuggest", [], function (cm, active) {
    cm.on("cursorActivity", function () {
        // const mode = cm.getModeAt(cm.getCursor());
        const options = {
            completeSingle: false,
            hint: hintFunction
        };
        if (active) {
            cm.showHint(options);
        }
    });
});
