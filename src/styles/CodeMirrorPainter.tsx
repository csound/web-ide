import React from "react";

export const CodeMirrorPainter = ({ theme }) => (
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
          .CodeMirror-hints {
                     z-index: 3;
                     background-color: ${theme.background.primary};
                     position: absolute;
                     box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.8);
                     color: ${theme.lineNumber.primary};
                     border: 2px solid ${theme.highlight.primary};
                     border-radius: 6px;
                     list-style: none;
                     font-family: ${theme.font.monospace};
                     margin: 0;
                     padding: 0;
                     font-size: 16px;
                      max-height: 138px;
                      overflow: hidden;
          }
          .CodeMirror-hint {
                      line-height: 20px;
                      padding: 6px!important;
                      padding-right: 6px!important;
                      position: relative;
                      display: block;
                      margin: 0;}
          .CodeMirror-hint-active {
                   background-color: ${theme.highlightAlt.primary};
                   color: ${theme.opcode.primary};
                   font-weight: 500;
          }
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
