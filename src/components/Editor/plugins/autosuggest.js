/* eslint-disable */
import * as CodeMirror from "codemirror";
import "./show-hint";
import synopsis from "csound-manual-react/lib/manual/synopsis";
import {
    append,
    assoc,
    take,
    pick,
    pipe,
    propOr,
    reduce,
    reject,
    values
} from "ramda";

const opcodes = reject(
    s => s.includes("(") || s.includes(")"),
    Object.keys(synopsis)
);
import Fuse from "fuse.js";

const fuzzyMatcher = new Fuse(opcodes, {
    shouldSort: false,
    caseSensitive: true,
    threshold: 0.1,
    distance: 10
});

async function hintFn(cm, callback, arg3) {
    const cur = cm.getDoc().getCursor();
    const tokenData = cm.getTokenAt(cur);
    const token = propOr(false, "string", tokenData);
    if (
        !token ||
        cur.ch !== tokenData.end ||
        token.length < 3 ||
        tokenData.type === "comment"
    )
        return;
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
        (acc, res) =>
            append(
                {
                    className: "",
                    text: res.item,
                    displayText: res.item,
                    from: CodeMirror.Pos(cur.line, start),
                    to: CodeMirror.Pos(cur.line, end)
                },
                acc
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

hintFn.async = true;

CodeMirror.defineOption("autoSuggest", [], function(cm, active, old) {
    cm.on("cursorActivity", function() {
        const mode = cm.getModeAt(cm.getCursor());
        const options = {
            completeSingle: false,
            hint: hintFn
        };
        if (active) {
            cm.showHint(options);
        }
    });
});
