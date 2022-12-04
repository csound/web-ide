import React from "react";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
// import { createTheme } from "@uiw/codemirror-themes";
import { tags } from "@lezer/highlight";
import {
    ambiguousTag,
    opcodeTag,
    bracketTag,
    controlFlowTag,
    xmlTag,
    defineOperatorTag
} from "@comp/editor/modes/csound/csound";
import { CsoundTheme } from "@comp/themes/types";
import monokaiTheme from "./_theme-monokai";
import githubTheme from "./_theme-github";

interface EditorViewTheme {
    gutterBackground: string;
    background: string;
    aRateVar: string;
    kRateVar: string;
    pField: string;
    fRateVar: string;
    keyword: string;
    macro: string;
    opcode: string;
    string: string;
    caretColor: string;
    selectedTextColor: string;
    textColor: string;
}

const makeEditorViewStyleSheet = (theme: EditorViewTheme) => ({
    "&": {
        color: theme.textColor,
        backgroundColor: theme.background
    },
    ".cm-editor": {
        height: "100%"
    },
    // selection
    "&.cm-focused .cm-selectionBackground, & .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection":
        {
            backgroundColor: theme.selectedTextColor
        },
    ".cm-content": {
        fontSize: "16px",
        fontFamily: "'Fira Mono', monospace"
    },
    "&.cm-focused .cm-cursor": {
        borderLeftColor: theme.caretColor
    },

    ".cm-gutters": {
        backgroundColor: theme.gutterBackground,
        color: "#ddd",
        border: "none"
    },
    ".cm-gutter": {
        order: 1
    },
    // ".cm-gutter:nth-of-type(1)": {
    //     order: 0
    // },
    ".cm-panels-bottom": {
        fontFamily: "'Fira Mono', monospace",
        fontSize: "14px",
        fontStyle: "italic",
        userSelect: "none",
        backgroundColor: theme.gutterBackground,
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
            color: theme.aRateVar
        }
    },
    ".cm-csound-p-field-var": {
        "& > span": {
            color: theme.pField,
            fontWeight: 600
        }
    },
    ".cm-csound-f-rate-var": {
        "& > span": {
            color: theme.fRateVar
        }
    },
    ".cm-csound-opcode": {
        "& > span": {
            color: theme.opcode
        }
    },
    ".cm-csound-global-constant": {
        "& > span": {
            color: theme.keyword
        }
    },
    ".cm-csound-macro-token": {
        "& > span": {
            color: theme.macro,
            fontWeight: 600
        }
    },
    ".cm-csound-xml-tag": {
        "& > span": {
            color: theme.opcode
        }
    },
    ".cm-csound-k-rate-var": {
        "& > span": {
            color: theme.kRateVar
        }
    },
    ".cm-csound-s-rate-var": {
        "& > span": {
            color: theme.string
        }
    }
});

export const monokaiThemeEditor = EditorView.theme(
    makeEditorViewStyleSheet(monokaiTheme),
    { dark: true }
);

export const githubThemeEditor = EditorView.theme(
    makeEditorViewStyleSheet(githubTheme),
    { dark: false }
);

interface TagsTheme {
    iRateVar: string;
    comment: string;
    keyword: string;
    opcode: string;
    string: string;
    bracket: string;
    controlFlow: string;
}

const makeReactThemeTags = (theme: TagsTheme) => [
    { tag: tags.comment, color: theme.comment },
    { tag: tags.lineComment, color: theme.comment },
    { tag: tags.string, color: theme.string },
    { tag: ambiguousTag, color: theme.iRateVar },
    { tag: opcodeTag, color: theme.opcode },
    { tag: defineOperatorTag, color: theme.keyword },
    { tag: bracketTag, color: theme.bracket },
    { tag: controlFlowTag, color: theme.controlFlow },
    { tag: xmlTag, color: theme.opcode }
];

export const monokaiThemeTags = syntaxHighlighting(
    HighlightStyle.define(makeReactThemeTags(monokaiTheme))
);

export const githubThemeTags = syntaxHighlighting(
    HighlightStyle.define(makeReactThemeTags(githubTheme))
);

// export const githubThemeReact = createTheme({
//     theme: "light",
//     settings: {
//         background: githubTheme.background,
//         foreground: githubTheme.textColor,
//         lineHighlight: "rgba(0,0,0,0)",
//         // caret: "red",
//         caret: "#c6c6c6",
//         selection: githubTheme.selectedTextColor
//     },
//     styles: makeReactThemeTags(githubTheme)
// });

export const resolveTheme = (themeName: CsoundTheme): [any, any] => {
    switch (themeName) {
        case "monokai": {
            return [monokaiThemeEditor, monokaiThemeTags];
        }
        case "github": {
            return [githubThemeEditor, githubThemeTags];
        }
        default: {
            return [monokaiThemeEditor, monokaiThemeTags];
        }
    }
};
