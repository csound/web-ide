/* eslint-disable */
import * as CodeMirror from "codemirror";
import "codemirror/addon/hint/show-hint";
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
    if (!token || token.length < 3) return;
    const start = tokenData.start;
    const end = tokenData.end;
    const list = pipe(
        pick(take(50, fuzzyMatcher.search(token))),
        values,
        reduce(
            (acc, token) =>
                append(
                    {
                        className: "",
                        text: token,
                        displayText: token,
                        from: CodeMirror.Pos(cur.line, start),
                        to: CodeMirror.Pos(cur.line, end)
                    },
                    acc
                ),
            []
        )
    )(opcodes);
    typeof callback === "function" && callback({ list });
    // return { list };
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
