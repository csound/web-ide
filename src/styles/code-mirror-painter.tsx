import React from "react";

import { EditorView } from "@codemirror/view";
import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import {
    opcodeTag,
    bracketTag,
    iRateVarTag,
    kRateVarTag,
    aRateVarTag,
    pFieldTag,
    xmlTag,
    globalConstantTag,
    defineOperatorTag
} from "@comp/editor/modes/csound/csound";
import monokaiTheme from "./_theme-monokai";

export const monokaiEditor = EditorView.theme(
    {
        "&": {
            color: "white",
            backgroundColor: monokaiTheme.background
        },
        ".cm-content": {
            caretColor: "#0e9",
            fontSize: "18px",
            fontFamily: "'Fira Mono', monospace"
        },
        "&.cm-focused .cm-cursor": {
            borderLeftColor: "#0e9"
        },
        "&.cm-focused .cm-selectionBackground, ::selection": {
            backgroundColor: "#074"
        },
        ".cm-gutters": {
            backgroundColor: "#3E3D31",
            color: "#ddd",
            border: "none"
        },
        ".cm-lineNumbers": {
            fontFamily: "'Fira Mono', monospace",
            fontSize: "16px"
        }
    },
    { dark: true }
);

export const monokaiHighlightStyle = HighlightStyle.define([
    { tag: tags.comment, color: monokaiTheme.comment },
    { tag: tags.lineComment, color: monokaiTheme.comment },
    { tag: tags.string, color: monokaiTheme.string },
    { tag: opcodeTag, color: monokaiTheme.opcode },
    { tag: globalConstantTag, color: monokaiTheme.keyword },
    { tag: defineOperatorTag, color: monokaiTheme.keyword },
    { tag: bracketTag, color: monokaiTheme.bracket },
    { tag: iRateVarTag, color: monokaiTheme.iRateVar },
    { tag: kRateVarTag, color: monokaiTheme.kRateVar },
    { tag: aRateVarTag, color: monokaiTheme.aRateVar },
    { tag: pFieldTag, color: monokaiTheme.pField },
    { tag: xmlTag, color: monokaiTheme.opcode }
]);
