import React from "react";
import { useSelector } from "react-redux";
import { ThemeProvider } from "emotion-theming";
import { pathOr } from "ramda";
import { ITheme } from "./types";

const CodeMirrorPainter = ({ theme }) => (
    <style>
        {`.CodeMirror { background: ${theme.background.primary};
                        color: ${theme.color.primary}; }
          .CodeMirror-selected { background: ${theme.highlight.primary}; }
          .CodeMirror-focused .CodeMirror-selected,
          .CodeMirror-line::selection,
          .CodeMirror-line > span::selection,
          .CodeMirror-line > span > span::selection
              { background: ${theme.highlightAlt.primary}; }
          .CodeMirror-line { padding: 0!important; }
          .CodeMirror-gutters { background: ${theme.gutterBackground.primary};
                                border-right: 0px; }
          .CodeMirror-guttermarker { color: ${theme.gutterMarker.primary}; }
          .CodeMirror-guttermarker-subtle { color: ${theme.gutterMarkerSubtle.primary}; }
          .CodeMirror-gutter-wrapper { left: -51px!important; }
          .CodeMirror-linenumber { color: ${theme.lineNumber.primary}; min-width: 32px; }
          .CodeMirror-cursor { border-left: 1px solid ${theme.cursor.primary}; }

          .cm-attribute { color: ${theme.attribute.primary}!important; }
          .cm-variable   {color: ${theme.opcode.primary}; font-weight: 500;}
          .cm-keyword   {color: ${theme.keyword.primary}!important; font-weight: 500;}
          .cm-string   {color: ${theme.string.primary}!important; font-weight: 500;}
          .cm-variable-2,.cm-tag {color: ${theme.aRateVar.primary}!important; font-weight: 500;}
          .cm-variable-3 {color: ${theme.iRateVar.primary}!important; font-weight: 500;}
          .cm-variable-4 {color: ${theme.kRateVar.primary}; font-weight: 500;}
          .cm-variable-5 {color: ${theme.fRateVar.primary}; font-weight: 500;}
          .cm-variable-6 {color: ${theme.pField.primary}; font-weight: 800;}
          .cm-number {color: ${theme.number.primary}!important;}
          .cm-operator {color: ${theme.operator.primary};}
          .cm-global {font-style: italic; font-weight: 800;}
          .cm-s-default {color: ${theme.color.primary};}
          .cm-bracket { color: ${theme.color.primary}; ]
}

          .cm-error { color: ${theme.error.primary}; }
          .cm-comment { color: ${theme.comment.primary}!important; }
          .cm-comment.cm-attribute { color: ${theme.commentAttribute.primary}; }
          .cm-comment.cm-def { color: ${theme.commentDef.primary}; }
          .cm-comment.cm-tag { color: ${theme.commentTag.primary}; }
          .cm-comment.cm-type { color: ${theme.commentType.primary}; }

          /* blink eval */
          @keyframes flash-animation {
              0% {
                 background-color: ${theme.flash.primary};
              }
              100% {
                 background-color: ${theme.flash.secondary};
              }
          }
          .blinkEval {
              z-index: 9999999;
              animation-name: flash-animation;
              animation-duration: 0.1s;
              animation-fill-mode: forwards;
          }
          .blinkEvalError {
              z-index: 9999999;
              background-color: ${theme.error.primary};
          }
        `}
    </style>
);

const CsoundWebIdeThemeProvider = props => {
    const theme: ITheme | null = useSelector(
        pathOr(null, ["ThemeReducer", "selectedTheme"])
    );
    return (
        <ThemeProvider theme={theme ? theme : {}}>
            <CodeMirrorPainter theme={theme} />
            {props.children}
        </ThemeProvider>
    );
};

export default CsoundWebIdeThemeProvider;
