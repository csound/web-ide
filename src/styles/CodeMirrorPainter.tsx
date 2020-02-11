import React from "react";

export const CodeMirrorPainter = ({ theme }) => (
    <style>
        {`.CodeMirror { background: ${theme.background};
                        color: ${theme.textColor}; }
          .CodeMirror-selected { background: ${theme.highlightBackground}; }
          .CodeMirror-focused .CodeMirror-selected,
          .CodeMirror-line::selection,
          .CodeMirror-line > span::selection,
          .CodeMirror-line > span > span::selection
              { background: ${theme.selectedTextColor}; }
          .CodeMirror-line { padding: 0!important; }
          .CodeMirror-gutter { background: ${theme.gutterBackground}; }
          .CodeMirror-gutters { background: ${theme.gutterBackground};
                                border-right: 0px; }
          .CodeMirror-guttermarker { color: ${theme.gutterMarker}; }
          .CodeMirror-guttermarker-subtle { color: ${theme.gutterMarkerSubtle}; }
          .CodeMirror-gutter-wrapper { left: -51px!important; }
          .CodeMirror-linenumber { color: ${theme.lineNumber}; min-width: 32px; }
          .CodeMirror-cursor { border-left: 1px solid ${theme.cursor}; }
          .CodeMirror-hints {
                     z-index: 3;
                     background-color: ${theme.background};
                     position: absolute;
                     box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.8);
                     color: ${theme.lineNumber};
                     border: 2px solid ${theme.line};
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
                   background-color: ${theme.highlightBackgroundAlt};
                   color: ${theme.opcode};
                   font-weight: 500;
          }
          .cm-attribute { color: ${theme.attribute}!important; }
          .cm-variable   {color: ${theme.opcode}; font-weight: 500;}
          .cm-keyword   {color: ${theme.keyword}!important; font-weight: 500;}
          .cm-string   {color: ${theme.string}!important; font-weight: 500;}
          .cm-variable-2,.cm-tag {color: ${theme.aRateVar}!important; font-weight: 500;}
          .cm-variable-3 {color: ${theme.iRateVar}!important; font-weight: 500;}
          .cm-variable-4 {color: ${theme.kRateVar}; font-weight: 500;}
          .cm-variable-5 {color: ${theme.fRateVar}; font-weight: 500;}
          .cm-variable-6 {color: ${theme.pField}; font-weight: 800;}
          .cm-number {color: ${theme.number}!important;}
          .cm-operator {color: ${theme.operator};}
          .cm-global {font-style: italic; font-weight: 800;}
          .cm-s-default {color: ${theme.textColor};}
          .cm-bracket { color: ${theme.textColor}; ]
}

          .cm-error { color: ${theme.errorText}; }
          .cm-comment { color: ${theme.comment}!important; }
          .cm-comment.cm-attribute { color: ${theme.commentAttribute}; }
          .cm-comment.cm-def { color: ${theme.commentDef}; }
          .cm-comment.cm-tag { color: ${theme.commentTag}; }
          .cm-comment.cm-type { color: ${theme.commentType}; }

          /* blink eval */
          @keyframes flash-animation {
              0% {
                 background-color: ${theme.flash};
              }
              100% {
                 background-color: ${theme.flashFade};
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
              background-color: ${theme.errorText};
          }
    `}
    </style>
);
