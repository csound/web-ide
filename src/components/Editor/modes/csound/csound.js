// Csound Mode - based on Ruby Mode provided by
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

import * as CodeMirror from "codemirror";
import synopsis from "csound-manual-react/lib/manual/synopsis";

/* eslint-disable */
CodeMirror.defineMode("csound", function(config) {
    function wordObj(words) {
        var o = {};
        for (var i = 0, e = words.length; i < e; ++i) o[words[i]] = true;
        return o;
    }
    var keywords = [
        "ksmps",
        "opcode",
        "endop",
        "instr",
        "endin",
        "0dbfs",
        "sr",
        "kr",
        "nchnls",
        "nchnls_i"
    ];

    var attributes = [
        "while",
        "do",
        "od",
        "if",
        "elseif",
        "else",
        "endif",
        "until",
        "then"
    ];
    var opcodes = Object.keys(synopsis);
    var indentWords = wordObj(["opcode", "instr", "while", "until"]);
    var dedentWords = wordObj(["endif", "endop", "endin"]);
    var matching = { "[": "]", "{": "}", "(": ")" };
    var curPunc;

    function chain(newtok, stream, state) {
        state.tokenize.push(newtok);
        return newtok(stream, state);
    }

    function tokenBase(stream, state) {
        if (stream.match(/\/\*/)) {
            state.tokenize.push(readBlockComment);
            return "comment";
        }
        if (stream.eatSpace()) return null;
        if (stream.match("0dbfs", true)) return "keyword";

        var ch = stream.next(),
            m;
        if (ch == "`" || ch == "'" || ch == '"') {
            return chain(
                readQuoted(ch, "string", ch == '"' || ch == "`"),
                stream,
                state
            );
        } else if (ch == "%") {
            var style = "string",
                embed = true;
            if (stream.eat("s")) style = "atom";
            else if (stream.eat(/[WQ]/)) style = "string";
            else if (stream.eat(/[r]/)) style = "string-2";
            else if (stream.eat(/[wxq]/)) {
                style = "string";
                embed = false;
            }
            var delim = stream.eat(/[^\w\s=]/);
            if (!delim) return "operator";
            if (matching.propertyIsEnumerable(delim)) delim = matching[delim];
            return chain(readQuoted(delim, style, embed, true), stream, state);
        } else if (ch == ";" || (ch == "/" && stream.eat("/"))) {
            stream.skipToEnd();
            return "comment";
        } else if (
            ch == "<" &&
            (m = stream.match(/^<-?[\`\"\']?([a-zA-Z_?]\w*)[\`\"\']?(?:;|$)/))
        ) {
            return chain(readHereDoc(m[1]), stream, state);
        } else if (ch == "0") {
            if (stream.eat("x")) stream.eatWhile(/[\da-fA-F]/);
            else if (stream.eat("b")) stream.eatWhile(/[01]/);
            else stream.eatWhile(/[0-7]/);
            return "number";
        } else if (/[\d\.?]/.test(ch)) {
            stream.match(/^[\d_]*(?:\.[\d_]+)?(?:[eE][+\-]?[\d_]+)?/);
            return "number";
        } else if (ch == "?") {
            while (stream.match(/^\\[CM]-/)) {}
            if (stream.eat("\\")) stream.eatWhile(/\w/);
            else stream.next();
            return "string";
        }
        // else if (ch == ":") {
        //     if (stream.eat("'"))
        //         return chain(readQuoted("'", "atom", false), stream, state);
        //     if (stream.eat('"'))
        //         return chain(readQuoted('"', "atom", true), stream, state);
        //
        //     // :> :>> :< :<< are valid symbols
        //     if (stream.eat(/[\<\>]/)) {
        //         stream.eat(/[\<\>]/);
        //         return "atom";
        //     }
        //
        //     // :+ :- :/ :* :| :& :! are valid symbols
        //     // if (stream.eat(/[\+\-\*\/\&\|\:\!]/)) {
        //     //     return "atom";
        //     // }
        //
        //     // Symbols can't start by a digit
        //     if (stream.eat(/[a-zA-Z$@_\xa1-\uffff]/)) {
        //         stream.eatWhile(/[\w$\xa1-\uffff]/);
        //         // Only one ? ! = is allowed and only as the last character
        //         stream.eat(/[\?\!\=]/);
        //         return "atom";
        //     }
        //     return "operator";
        // }
        // else if (ch == "@" && stream.match(/^@?[a-zA-Z_\xa1-\uffff]/)) {
        //     stream.eat("@");
        //     stream.eatWhile(/[\w\xa1-\uffff]/);
        //     return "variable-2";
        // }
        else if (ch == "$") {
            if (stream.eat(/[a-zA-Z_]/)) {
                stream.eatWhile(/[\w]/);
            } else if (stream.eat(/\d/)) {
                stream.eat(/\d/);
            } else {
                stream.next(); // Must be a special global like $: or $!
            }
            return "variable-3";
        } else if (/[a-zA-Z_\xa1-\uffff]/.test(ch)) {
            stream.eatWhile(/[\w\xa1-\uffff]/);
            stream.eat(/[\?\!]/);

            if (stream.peek() == ":") {
                var isop = opcodes.some(s => s === stream.current());
                stream.next();
                if (
                    isop &&
                    (typeof stream.peek() == "string" &&
                        stream.peek().match(/[aik]/))
                ) {
                    stream.next();
                    return "variable";
                }
            }
            return "ident";
        } else if (
            ch == "|" &&
            (state.varList || state.lastTok == "{" || state.lastTok == "do")
        ) {
            curPunc = "|";
            return null;
        } else if (/[\(\)\[\]{}\\;]/.test(ch)) {
            curPunc = ch;
            return null;
        } else if (ch == "-" && stream.eat(">")) {
            return "arrow";
        } else if (/[=+\-\/*:\.^%<>~|]/.test(ch)) {
            var more = stream.eatWhile(/[=+\-\/*:\.^%<>~|]/);
            if (ch == "." && !more) curPunc = ".";
            return "operator";
        } else {
            return null;
        }
    }

    function tokenBaseUntilBrace(depth) {
        if (!depth) depth = 1;
        return function(stream, state) {
            if (stream.peek() == "}") {
                if (depth == 1) {
                    state.tokenize.pop();
                    return state.tokenize[state.tokenize.length - 1](
                        stream,
                        state
                    );
                } else {
                    state.tokenize[
                        state.tokenize.length - 1
                    ] = tokenBaseUntilBrace(depth - 1);
                }
            } else if (stream.peek() == "{") {
                state.tokenize[state.tokenize.length - 1] = tokenBaseUntilBrace(
                    depth + 1
                );
            }
            return tokenBase(stream, state);
        };
    }
    function tokenBaseOnce() {
        var alreadyCalled = false;
        return function(stream, state) {
            if (alreadyCalled) {
                state.tokenize.pop();
                return state.tokenize[state.tokenize.length - 1](stream, state);
            }
            alreadyCalled = true;
            return tokenBase(stream, state);
        };
    }
    function readQuoted(quote, style, embed, unescaped) {
        return function(stream, state) {
            var escaped = false,
                ch;

            if (state.context.type === "read-quoted-paused") {
                state.context = state.context.prev;
                stream.eat("}");
            }

            while ((ch = stream.next()) != null) {
                if (ch == quote && (unescaped || !escaped)) {
                    state.tokenize.pop();
                    break;
                }
                if (embed && ch == "#" && !escaped) {
                    if (stream.eat("{")) {
                        if (quote == "}") {
                            state.context = {
                                prev: state.context,
                                type: "read-quoted-paused"
                            };
                        }
                        state.tokenize.push(tokenBaseUntilBrace());
                        break;
                    } else if (/[@\$]/.test(stream.peek())) {
                        state.tokenize.push(tokenBaseOnce());
                        break;
                    }
                }
                escaped = !escaped && ch == "\\";
            }
            return style;
        };
    }
    function readHereDoc(phrase) {
        return function(stream, state) {
            if (stream.match(phrase)) state.tokenize.pop();
            else stream.skipToEnd();
            return "string";
        };
    }
    function readBlockComment(stream, state) {
        if (stream.match(/.*\*\//)) {
            state.tokenize.pop();
            stream.skipTo("*/");
        } else {
            stream.skipToEnd();
        }
        return "comment";
    }

    return {
        startState: function() {
            return {
                tokenize: [tokenBase],
                indented: 0,
                context: { type: "top", indented: -config.indentUnit },
                continuedLine: false,
                lastTok: null,
                varList: false
            };
        },

        token: function(stream, state) {
            curPunc = null;
            if (stream.sol()) state.indented = stream.indentation();
            var style = state.tokenize[state.tokenize.length - 1](
                    stream,
                    state
                ),
                kwtype;
            var thisTok = curPunc;
            if (style == "ident") {
                var word = stream.current();
                if (keywords.some(s => s === word)) {
                    style = "keyword";
                } else if (attributes.some(s => s === word)) {
                    style = "attribute";
                } else if (opcodes.some(s => s === word)) {
                    style = "variable";
                } else if (word.match(/^a[a-zA-Z0-9_]+/)) {
                    style = "variable-2";
                } else if (word.match(/^i[a-zA-Z0-9_]+/)) {
                    style = "variable-3";
                } else if (word.match(/^k[a-zA-Z0-9_]+/)) {
                    style = "variable-4";
                } else if (word.match(/^f[a-zA-Z0-9_]+/)) {
                    style = "variable-5";
                } else if (word.match(/^p[0-9]+/)) {
                    style = "variable-6";
                } else if (word.match(/^g[aikf][a-zA-Z0-9_]+/)) {
                    if (word.length > 1) {
                        switch (word.charAt(1)) {
                            case "a":
                                style = "variable-2 global";
                                break;
                            case "i":
                                style = "variable-3 global";
                                break;
                            case "k":
                                style = "variable-4 global";
                                break;
                            case "f":
                                style = "variable-5 global";
                                break;
                        }
                    }
                }

                style =
                    state.lastTok == "."
                        ? "number"
                        : /^[A-Z]\:?/.test(word)
                        ? "tag"
                        : // : state.lastTok == "#define#" ||
                          //   state.lastTok == "#include" ||
                          //   state.varList
                          // ? "def"
                          style;
                if (style == "keyword") {
                    thisTok = word;
                    if (indentWords.propertyIsEnumerable(word))
                        kwtype = "indent";
                    else if (dedentWords.propertyIsEnumerable(word))
                        kwtype = "dedent";
                    else if (
                        (word == "if" || word == "unless") &&
                        stream.column() == stream.indentation()
                    )
                        kwtype = "indent";
                    else if (
                        word == "do" &&
                        state.context.indented < state.indented
                    )
                        kwtype = "indent";
                }
            }
            if (curPunc || (style && style != "comment"))
                state.lastTok = thisTok;
            if (curPunc == "|") state.varList = !state.varList;

            if (kwtype == "indent" || /[\(\[\{]/.test(curPunc))
                state.context = {
                    prev: state.context,
                    type: curPunc || style,
                    indented: state.indented
                };
            else if (
                (kwtype == "dedent" || /[\)\]\}]/.test(curPunc)) &&
                state.context.prev
            )
                state.context = state.context.prev;

            if (stream.eol())
                state.continuedLine = curPunc == "\\" || style == "operator";

            return style;
        },

        indent: function(state, textAfter) {
            if (state.tokenize[state.tokenize.length - 1] != tokenBase)
                return 0;
            var firstChar = textAfter && textAfter.charAt(0);
            var ct = state.context;
            var closing =
                ct.type == matching[firstChar] ||
                (ct.type == "attribute" &&
                    /^(?:end|until|else|elsif|when|rescue)\b/.test(textAfter));
            return (
                ct.indented +
                (closing ? 0 : config.indentUnit) +
                (state.continuedLine ? config.indentUnit : 0)
            );
        },

        electricInput: /^\s*(?:end|rescue|elsif|else|\})$/,
        // lineComment: /;|\/\//,
        fold: "indent"
    };
});

CodeMirror.defineMIME("text/x-csound", "csound");
