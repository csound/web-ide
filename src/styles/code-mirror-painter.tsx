import React from "react";
import { EditorView } from "@codemirror/view";
import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import {
    ambiguousTag,
    opcodeTag,
    bracketTag,
    controlFlowTag,
    xmlTag,
    defineOperatorTag
} from "@comp/editor/modes/csound/csound";
import monokaiTheme from "./_theme-monokai";

export const monokaiEditor = EditorView.theme(
    {
        "&": {
            color: "white",
            backgroundColor: monokaiTheme.background
        },
        ".cm-editor": {
            height: "100%"
        },
        ".cm-content": {
            caretColor: "#0e9",
            fontSize: "16px",
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
        ".cm-panels-bottom": {
            fontFamily: "'Fira Mono', monospace",
            fontSize: "14px",
            fontStyle: "italic",
            userSelect: "none",
            backgroundColor: "#3E3D31",
            "& > div": {
                marginLeft: "12px"
            }
        },
        ".cm-lineNumbers": {
            fontFamily: "'Fira Mono', monospace",
            fontSize: "16px"
        },
        ".cm-csound-global-var": {
            "& > span": {
                fontWeight: 600
            }
        },
        ".cm-csound-a-rate-var": {
            "& > span": {
                color: monokaiTheme.aRateVar
            }
        },
        ".cm-csound-p-field-var": {
            "& > span": {
                color: monokaiTheme.pField,
                fontWeight: 600
            }
        },
        ".cm-csound-f-rate-var": {
            "& > span": {
                color: monokaiTheme.fRateVar
            }
        },
        ".cm-csound-opcode": {
            "& > span": {
                color: monokaiTheme.opcode
            }
        },
        ".cm-csound-global-constant": {
            "& > span": {
                color: monokaiTheme.keyword
            }
        },
        ".cm-csound-macro-token": {
            "& > span": {
                color: monokaiTheme.macro,
                fontWeight: 600
            }
        },
        ".cm-csound-xml-tag": {
            "& > span": {
                color: monokaiTheme.opcode
            }
        },
        ".cm-csound-k-rate-var": {
            "& > span": {
                color: monokaiTheme.kRateVar
            }
        },
        ".cm-csound-s-rate-var": {
            "& > span": {
                color: monokaiTheme.string
            }
        }
    },
    { dark: true }
);

export const monokaiHighlightStyle = HighlightStyle.define([
    { tag: tags.comment, color: monokaiTheme.comment },
    { tag: tags.lineComment, color: monokaiTheme.comment },
    { tag: tags.string, color: monokaiTheme.string },
    { tag: ambiguousTag, color: monokaiTheme.iRateVar },
    { tag: opcodeTag, color: monokaiTheme.opcode },
    { tag: defineOperatorTag, color: monokaiTheme.keyword },
    { tag: bracketTag, color: monokaiTheme.bracket },
    { tag: controlFlowTag, color: monokaiTheme.controlFlow },
    { tag: xmlTag, color: monokaiTheme.opcode }
]);
