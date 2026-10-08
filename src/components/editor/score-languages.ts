import {
    HighlightStyle,
    LRLanguage,
    ParseContext,
    StreamLanguage,
    syntaxHighlighting
} from "@codemirror/language";
import { parseMixed } from "@lezer/common";
import { Tag } from "@lezer/highlight";
import { csoundCsdLanguage } from "@kunstmusik/codemirror-lang-csound";
import { scoreNotation, scoreSections } from "../csound/score-source";
import { csdScoreSections } from "./csd-score-sections";

type Notation = "csbeats" | "scot";
type State = { notation?: Notation; comment: boolean };
const tokenTable = {
    scorePitch: Tag.define(),
    scoreDuration: Tag.define(),
    scoreInstrument: Tag.define(),
    scoreKeyword: Tag.define(),
    scoreNumber: Tag.define(),
    scoreComment: Tag.define(),
    scoreString: Tag.define(),
    scoreBracket: Tag.define(),
    scoreTag: Tag.define()
};
const classes = {
    scorePitch: "cm-score-pitch cm-csound-a-rate-var",
    scoreDuration: "cm-score-duration cm-csound-number",
    scoreInstrument: "cm-score-instrument cm-csound-opcode",
    scoreKeyword: "cm-score-keyword cm-csound-define",
    scoreNumber: "cm-score-number cm-csound-number",
    scoreComment: "cm-score-comment cm-csound-comment",
    scoreString: "cm-score-string cm-csound-s-rate-var",
    scoreBracket: "cm-score-bracket cm-csound-bracket",
    scoreTag: "cm-score-tag cm-csound-xml-tag"
};
export const scoreHighlighting = syntaxHighlighting(
    HighlightStyle.define(
        Object.entries(tokenTable).map(([name, tag]) => ({
            tag,
            class: classes[name as keyof typeof classes]
        }))
    )
);

function notationLanguage(notation?: Notation) {
    return StreamLanguage.define<State>({
        name: notation ?? "External score",
        startState: () => ({ notation, comment: false }),
        tokenTable,
        languageData: { commentTokens: { line: ";" } },
        token(stream, state) {
            if (stream.eatSpace()) return null;
            const open = stream.match(/^<CsScore\b[^>]*>/);
            if (open && typeof open !== "boolean") {
                state.notation = scoreNotation(
                    open[0].match(/\bbin="([^"]+)"/)?.[1] ?? ""
                );
                state.comment = false;
                return "scoreTag";
            }
            if (stream.match(/^<\/CsScore>/)) {
                state.notation = notation;
                state.comment = false;
                return "scoreTag";
            }
            if (!state.notation) {
                stream.skipToEnd();
                return null;
            }
            if (state.comment || stream.match("/*")) {
                state.comment = !stream.skipTo("*/");
                if (state.comment) stream.skipToEnd();
                else stream.match("*/");
                return "scoreComment";
            }
            if (stream.match(/^(?:;|\/\/)/)) {
                stream.skipToEnd();
                return "scoreComment";
            }
            if (stream.match(/^"(?:[^"\\]|\\.)*"?/)) return "scoreString";
            if (stream.match(/^[{}()[\]]/)) return "scoreBracket";
            if (state.notation === "csbeats") {
                if (stream.match(/^(?:[A-G](?:bb|b|#|x)?-?\d+|[RZ])\b/))
                    return "scorePitch";
                if (
                    stream.match(/^(?:th|[whqes])(?:dd|d|\.{1,2})?(?:[qst])?\b/)
                )
                    return "scoreDuration";
                if (stream.match(/^i\d+(?:\.\d+)?\b/)) return "scoreInstrument";
                if (
                    stream.match(
                        /^(?:beats|bpm|permeasure|bar|end|quit|p{1,3}|f{1,3}|m[fp])\b/
                    )
                )
                    return "scoreKeyword";
                if (stream.match(/^[mbp]\d+(?:\.\d+)?\b/)) return "scoreNumber";
            } else {
                if (stream.match(/^\$[\w]+/)) return "scoreInstrument";
                if (stream.match(/^(?:orchestra|functions|score)\b|^![a-z]+/))
                    return "scoreKeyword";
                if (stream.match(/^[a-gr](?:[#bn]+)?/)) return "scorePitch";
                if (stream.match(/^\d+\.*(?=[a-gr])/)) return "scoreDuration";
            }
            if (stream.match(/^[+-]?(?:\d+\.?\d*|\.\d+)/)) return "scoreNumber";
            stream.match(/^[\w]+/) || stream.next();
            return null;
        }
    });
}

export const csbeatsLanguage = notationLanguage("csbeats");
export const scotLanguage = notationLanguage("scot");
const embeddedScoreLanguage = notationLanguage();

// The base grammar only recognizes the literal bin="csbeats". An overlay also
// covers SCOT and filesystem paths without changing how orchestra code parses.
export const csdWithScoreLanguages = LRLanguage.define({
    name: "csound-csd",
    languageData: {
        commentTokens: { line: ";", block: { open: "/*", close: "*/" } },
        closeBrackets: { brackets: ["(", "[", "{", '"'] }
    },
    parser: csoundCsdLanguage.parser.configure({
        wrap: parseMixed((node, input) => {
            if (!node.type.isTop) return null;
            const cached = ParseContext.get()?.state.field(
                csdScoreSections,
                false
            );
            // A direct parser.parse() call has no editor state to share.
            const source = cached?.source ?? input.read(0, input.length);
            const external =
                cached?.external ??
                scoreSections(source).filter((section) =>
                    scoreNotation(section.command)
                );
            const overlay = external
                // Keep the newline so a stream parser cannot join two distant tag lines.
                .map(({ from, to }) => ({
                    from,
                    to: source[to] === "\n" ? to + 1 : to
                }));
            return overlay.length
                ? { parser: embeddedScoreLanguage.parser, overlay }
                : null;
        })
    })
});
