import {
    LRLanguage,
    LanguageSupport,
    indentNodeProp
} from "@codemirror/language";
import { completeFromList } from "@codemirror/autocomplete";
import { parser } from "./syntax.grammar";
import { Tag, styleTags, tags as t } from "@lezer/highlight";

export const opcodeTag = Tag.define();
export const xmlTag = Tag.define();
export const bracketTag = Tag.define();
export const defineOperatorTag = Tag.define();
export const globalConstantTag = Tag.define();
export const iRateVarTag = Tag.define();
export const kRateVarTag = Tag.define();
export const aRateVarTag = Tag.define();
export const pFieldTag = Tag.define();

const csoundTags = styleTags({
    GlobalConstants: globalConstantTag,
    Instr: defineOperatorTag,
    Endin: defineOperatorTag,
    String: t.string,
    LineComment: t.lineComment,
    BlockComment: t.comment,
    Opcode: opcodeTag,
    InitRateIdentifier: iRateVarTag,
    KontrolRateIdentifier: kRateVarTag,
    AudioRateIdentifier: aRateVarTag,
    PFieldIdentifier: pFieldTag,
    XmlCsoundSynthesizerOpen: xmlTag,
    XmlOpen: xmlTag,
    XmlClose: xmlTag,
    "(": bracketTag,
    ")": bracketTag,
    "[": bracketTag,
    "]": bracketTag,
    "{": bracketTag,
    "}": bracketTag
});

export const orcLanguage = LRLanguage.define({
    dialect: "csd",
    parser: parser.configure({
        props: [
            csoundTags,
            indentNodeProp.add({
                InstrDeclaration: (context) =>
                    context.column(context.node.from) + context.unit
            })
        ]
        //strict: true
    }),
    languageData: {
        closeBrackets: { brackets: ["(", "[", "{", "'", '"'] },
        commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
        // indentOnInput: /^\s*(?:case |default:|\{|\}|<\/)$/,
        wordChars: "$"
    }
});

export const csdLanguage = orcLanguage.configure({ dialect: "csd" });

export function csoundMode() {
    const completionList = csdLanguage.data.of({
        autocomplete: completeFromList(
            (window.csoundSynopsis || [])
                .filter(
                    ({ opname }) =>
                        !["0dbfs", "sr", "kr", "ksmps", "nchnls"].includes(
                            opname
                        )
                )
                .map(({ opname, short_desc, type }) => ({
                    label: opname,
                    type: type === "opcode" ? "keyword" : "function",
                    detail: short_desc
                }))
        )
    });
    return new LanguageSupport(csdLanguage, [completionList]);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
// export const registerCsoundMode = () => {
// CodeMirror.defineMode("csound", function (config, parserConfig) {
//     const opcodes = new Set(window.csoundSynopsis.map((opc) => opc.opname));
//     const documentType = parserConfig.documentType || "csd";
//     const indentWords = wordsToObject([
//         "opcode",
//         "instr",
//         "while",
//         "until",
//         "then"
//     ]);
//     const dedentWords = wordsToObject(["endif", "endop", "endin", "od"]);
//     const matching = { "[": "]", "{": "}", "(": ")" };
//     let currentPunctuation;
//     function tokenBase(stream, state) {
//         if (stream.eatSpace()) {
//             return;
//         }
//         if (stream.match("0dbfs", true)) {
//             return "keyword";
//         }
//         if (
//             documentType === "csd" &&
//             !state.scoreSection &&
//             stream.match("<CsScore", true)
//         ) {
//             state.scoreSection = true;
//             stream.backUp("<CsScore".length);
//             return;
//         }
//         const ch = stream.next();
//         let m;
//         if (ch === "`" || ch === "'" || ch === '"') {
//             return chain(
//                 readQuoted(ch, "string", ch === '"' || ch === "`"),
//                 stream,
//                 state
//             );
//         } else if (ch === "%") {
//             let style = "string";
//             let embed = true;
//             if (stream.eat("s")) {
//                 style = "atom";
//             } else if (stream.eat(/[QW]/)) {
//                 style = "string";
//             } else if (stream.eat(/r/)) {
//                 style = "string-2";
//             } else if (stream.eat(/[qwx]/)) {
//                 style = "string";
//                 embed = false;
//             }
//             let delim = stream.eat(/[^\s\w=]/);
//             if (!delim) {
//                 return "operator";
//             }
//             if (typeof matching[delim] === "number") {
//                 delim = matching[delim];
//             }
//             return chain(
//                 readQuoted(delim, style, embed, true),
//                 stream,
//                 state
//             );
//         } else if (ch === ";" || (ch === "/" && stream.eat("/"))) {
//             stream.skipToEnd();
//             return "comment";
//         } else if (
//             state.withinBlockComment ||
//             (ch === "/" && stream.eat("*"))
//         ) {
//             if (stream.string.includes("*/")) {
//                 state.withinBlockComment = false;
//                 stream.pos = stream.string.indexOf("*/") + 2;
//             } else {
//                 stream.skipToEnd();
//                 state.withinBlockComment = true;
//             }
//             return "comment";
//         } else if (
//             ch === "<" &&
//             (m = stream.match(/^<-?["'`]?([?A-Z_a-z]\w*)["'`]?(?:;|$)/))
//         ) {
//             return chain(readHereDocument(m[1]), stream, state);
//         } else if (ch === "0") {
//             if (stream.eat("x")) {
//                 stream.eatWhile(/[\dA-Fa-f]/);
//             } else if (stream.eat("b")) {
//                 stream.eatWhile(/[01]/);
//             } else {
//                 stream.eatWhile(/[0-7]/);
//             }
//             return "number";
//         } else if (/[\d.?]/.test(ch)) {
//             stream.match(/^[\d_]*(?:\.[\d_]+)?(?:[Ee][+-]?[\d_]+)?/);
//             return "number";
//         } else if (ch === "?") {
//             while (/^\\[CM]-/.test(stream)) {}
//             if (stream.eat("\\")) {
//                 stream.eatWhile(/\w/);
//             } else {
//                 stream.next();
//             }
//             return "string";
//         } else if (ch === "$") {
//             if (stream.eat(/[A-Z_a-z]/)) {
//                 stream.eatWhile(/\w/);
//             } else if (stream.eat(/\d/)) {
//                 stream.eat(/\d/);
//             } else {
//                 stream.next(); // Must be a special global like $: or $!
//             }
//             return "variable-3";
//         } else if (/[A-Z_a-\uFFFF]/.test(ch)) {
//             stream.eatWhile(/[\dA-Z_a-\uFFFF]/);
//             stream.eat(/[!?]/);
//             const currentToken = stream.current();
//             if (stream.peek() === ":") {
//                 const maybeOpcode = stream.current();
//                 const isop = opcodes.has(maybeOpcode);
//                 stream.next();
//                 if (
//                     isop &&
//                     typeof stream.peek() == "string" &&
//                     /[Saik]/.test(stream.peek())
//                 ) {
//                     stream.next();
//                     state.lastTok = maybeOpcode;
//                     return "variable";
//                 } else if (!/[A-Z_a-\uFFFF]/.test(stream.peek() || "")) {
//                     return "variable-6";
//                 }
//             }
//             state.lastTok = currentToken;
//             return "ident";
//         } else if (
//             ch === "|" &&
//             (state.varList ||
//                 state.lastTok === "{" ||
//                 state.lastTok === "do")
//         ) {
//             currentPunctuation = "|";
//             return;
//         } else if (/[();[\\\]{}]/.test(ch)) {
//             currentPunctuation = ch;
//             return;
//         } else if (ch === "-" && stream.eat(">")) {
//             return "arrow";
//         } else if (/[%*+./:<=>^|~-]/.test(ch)) {
//             const more = stream.eatWhile(/[%*+./:<=>^|~-]/);
//             if (ch === "." && !more) {
//                 currentPunctuation = ".";
//             }
//             return "operator";
//         } else {
//             return;
//         }
//     }
//     function tokenBaseUntilBrace(depth) {
//         if (!depth) {
//             depth = 1;
//         }
//         return function (stream, state) {
//             if (stream.peek() === "}") {
//                 if (depth === 1) {
//                     state.tokenize.pop();
//                     return state.tokenize[state.tokenize.length - 1](
//                         stream,
//                         state
//                     );
//                 } else {
//                     state.tokenize[state.tokenize.length - 1] =
//                         tokenBaseUntilBrace(depth - 1);
//                 }
//             } else if (stream.peek() === "{") {
//                 state.tokenize[state.tokenize.length - 1] =
//                     tokenBaseUntilBrace(depth + 1);
//             }
//             return tokenBase(stream, state);
//         };
//     }
//     function tokenBaseOnce() {
//         let alreadyCalled = false;
//         return function (stream, state) {
//             if (alreadyCalled) {
//                 state.tokenize.pop();
//                 return state.tokenize[state.tokenize.length - 1](
//                     stream,
//                     state
//                 );
//             }
//             alreadyCalled = true;
//             return tokenBase(stream, state);
//         };
//     }
//     function readQuoted(quote, style, embed, unescaped) {
//         return function (stream, state) {
//             let escaped = false;
//             let ch;
//             if (state.context.type === "read-quoted-paused") {
//                 state.context = state.context.prev;
//                 stream.eat("}");
//             }
//             while ((ch = stream.next())) {
//                 if (ch === quote && (unescaped || !escaped)) {
//                     state.tokenize.pop();
//                     break;
//                 }
//                 if (embed && ch === "#" && !escaped) {
//                     if (stream.eat("{")) {
//                         if (quote === "}") {
//                             state.context = {
//                                 prev: state.context,
//                                 type: "read-quoted-paused"
//                             };
//                         }
//                         state.tokenize.push(tokenBaseUntilBrace());
//                         break;
//                     } else if (/[$@]/.test(stream.peek())) {
//                         state.tokenize.push(tokenBaseOnce());
//                         break;
//                     }
//                 }
//                 escaped = !escaped && ch === "\\";
//             }
//             return style;
//         };
//     }
//     return {
//         startState: function () {
//             return {
//                 tokenize: [tokenBase],
//                 indented: 0,
//                 context: { type: "top", indented: 0 },
//                 withinBlockComment: false,
//                 continuedLine: false,
//                 lastTok: undefined,
//                 varList: false,
//                 scoreSection:
//                     parserConfig.documentType === "sco" ? true : false
//             };
//         },
//         token: function (stream, state) {
//             currentPunctuation = undefined;
//             if (stream.sol()) {
//                 state.indented = stream.indentation();
//             }
//             let style = state.tokenize[state.tokenize.length - 1](
//                 stream,
//                 state
//             );
//             let kwtype;
//             let word;
//             let thisTok = currentPunctuation;
//             if (style === "ident") {
//                 word = stream.current();
//                 if (keywords.has(word)) {
//                     style = "keyword";
//                 } else if (attributes.has(word)) {
//                     style = "attribute";
//                 } else if (opcodes.has(word)) {
//                     style = "variable";
//                 } else if (/^a\w+/.test(word)) {
//                     style = "variable-2";
//                 } else if (/^i\w+/.test(word)) {
//                     style = "variable-3";
//                 } else if (/^k\w+/.test(word)) {
//                     style = "variable-4";
//                 } else if (/^f\w+/.test(word)) {
//                     style = "variable-5";
//                 } else if (/^p\d+/.test(word)) {
//                     style = "variable-6";
//                 } else if (/^g[afik]\w+/.test(word) && word.length > 1) {
//                     switch (word.charAt(1)) {
//                         case "a":
//                             style = "variable-2 global";
//                             break;
//                         case "i":
//                             style = "variable-3 global";
//                             break;
//                         case "k":
//                             style = "variable-4 global";
//                             break;
//                         case "f":
//                             style = "variable-5 global";
//                             break;
//                         default: {
//                             break;
//                         }
//                     }
//                 }
//                 style =
//                     state.lastTok === "."
//                         ? "number"
//                         : /^[A-Z]:?/.test(word)
//                         ? "tag"
//                         : // : state.lastTok == "#define#" ||
//                           //   state.lastTok == "#include" ||
//                           //   state.varList
//                           // ? "def"
//                           style;
//                 if (style === "keyword" || style === "attribute") {
//                     thisTok = word;
//                     if (typeof indentWords[word] === "number") {
//                         kwtype = "indent";
//                     } else if (typeof dedentWords[word] === "number") {
//                         kwtype = "dedent";
//                     } else if (
//                         (word === "if" || word === "unless") &&
//                         stream.column() === stream.indentation()
//                     ) {
//                         kwtype = "indent";
//                     } else if (
//                         word === "do" &&
//                         state.context.indented < state.indented
//                     ) {
//                         kwtype = "indent";
//                     }
//                 }
//             }
//             if (currentPunctuation || (style && style !== "comment")) {
//                 state.lastTok = thisTok;
//             }
//             if (currentPunctuation === "|") {
//                 state.varList = !state.varList;
//             }
//             if (kwtype === "indent" || /[([{]/.test(currentPunctuation)) {
//                 state.context = {
//                     prev: state.context,
//                     type: currentPunctuation || style,
//                     indented: state.indented
//                 };
//             } else if (
//                 (kwtype === "dedent" ||
//                     /[)\]}]/.test(currentPunctuation)) &&
//                 state.context.prev
//             ) {
//                 state.context = state.context.prev;
//             }
//             if (stream.eol()) {
//                 state.continuedLine =
//                     currentPunctuation === "\\" || style === "operator";
//             }
//             return style;
//         },
//         indent: function (state, textAfter) {
//             if (state.tokenize[state.tokenize.length - 1] !== tokenBase) {
//                 return 0;
//             }
//             const firstChar = textAfter && textAfter.charAt(0);
//             const ct = state.context;
//             const closing =
//                 ct.type === matching[firstChar] ||
//                 ((ct.type === "attribute" || ct.type === "keyword") &&
//                     /^(?:end|else|elseif|od)\b/.test(textAfter));
//             return state.scoreSection
//                 ? 0
//                 : ct.indented +
//                       (closing ? 0 : config.indentUnit) +
//                       (state.continuedLine ? config.indentUnit : 0);
//         },
//         electricInput: /^\s*(?:end|rescue|elsif|else|od|})$/,
//         lineComment: ";",
//         blockCommentStart: "/*",
//         blockCommentEnd: "*/",
//         fold: "indent"
//     };
// });
// CodeMirror.defineMIME("text/x-csound", "csound");
// CodeMirror.defineMIME("text/csound-csd", {
//     name: "csound",
//     documentType: "csd"
// });
// CodeMirror.defineMIME("text/csound-orc", {
//     name: "csound",
//     documentType: "orc"
// });
// CodeMirror.defineMIME("text/csound-udo", {
//     name: "csound",
//     documentType: "udo"
// });
// CodeMirror.defineMIME("text/csound-sco", {
//     name: "csound",
//     documentType: "sco"
// });
// };
