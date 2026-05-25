import { Decoration, EditorView } from '@codemirror/view';
import {
  HighlightStyle,
  syntaxTree,
  syntaxTreeAvailable,
  syntaxHighlighting,
} from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';
import { Tag, styleTags, tags as t } from '@lezer/highlight';
import { StyleModule } from 'style-mod';
import { builtinOpcodes, isGlobalConstant } from './parser-utils';

const commentCssClassName = 'cm-csound-comment';

const globalVarCssClassName = 'cm-csound-global-var';

const globalConstantCssClassName = 'cm-csound-global-constant';

const globalConstantDecoration = Decoration.mark({
  attributes: { class: globalConstantCssClassName },
});

const iRateVarCssClassName = 'cm-csound-i-rate-var';

const iRateVarDecoration = Decoration.mark({
  attributes: { class: iRateVarCssClassName },
});

const giRateVarDecoration = Decoration.mark({
  attributes: {
    class: [iRateVarCssClassName, globalVarCssClassName].join(' '),
  },
});

const opcodeCssClassName = 'cm-csound-opcode';

const opcodeDecoration = Decoration.mark({
  attributes: { class: opcodeCssClassName },
});

const aRateVarCssClassName = 'cm-csound-a-rate-var';

const aRateVarDecoration = Decoration.mark({
  attributes: { class: aRateVarCssClassName },
});

const gaRateVarDecoration = Decoration.mark({
  attributes: {
    class: [aRateVarCssClassName, globalVarCssClassName].join(' '),
  },
});

const kRateVarCssClassName = 'cm-csound-k-rate-var';

const kRateVarDecoration = Decoration.mark({
  attributes: { class: kRateVarCssClassName },
});

const gkRateVarDecoration = Decoration.mark({
  attributes: {
    class: [kRateVarCssClassName, globalVarCssClassName].join(' '),
  },
});

const sRateVarCssClassName = 'cm-csound-s-rate-var';

const sRateVarDecoration = Decoration.mark({
  attributes: { class: sRateVarCssClassName },
});

const gsRateVarDecoration = Decoration.mark({
  attributes: {
    class: [sRateVarDecoration, globalVarCssClassName].join(' '),
  },
});

const fRateVarCssClassName = 'cm-csound-f-rate-var';

const fRateVarDecoration = Decoration.mark({
  attributes: { class: fRateVarCssClassName },
});

const gfRateVarDecoration = Decoration.mark({
  attributes: {
    class: [fRateVarDecoration, globalVarCssClassName].join(' '),
  },
});

const pFieldVarCssClassName = 'cm-csound-p-field-var';

const pFieldVarDecoration = Decoration.mark({
  attributes: { class: pFieldVarCssClassName },
});

const xmlTagCssClassName = 'cm-csound-xml-tag';

const xmlTagDecoration = Decoration.mark({
  attributes: { class: xmlTagCssClassName },
});

const gotoTokenCssClassName = 'cm-csound-goto-token';

const gotoTokenDecoration = Decoration.mark({
  attributes: { class: gotoTokenCssClassName },
});

const macroTokenDecoration = Decoration.mark({
  attributes: { class: 'cm-csound-macro-token' },
});

const variableTag = Tag.define(); // acts as i-rate and fallback
const opcodeTag = Tag.define();
const xmlTag = Tag.define();
const bracketTag = Tag.define();
const defineOperatorTag = Tag.define();
const controlFlowTag = Tag.define();
const commentTag = Tag.define();
const macroTag = Tag.define();

export const csoundTags = styleTags({
  instr: defineOperatorTag,
  endin: defineOperatorTag,
  opcode: defineOperatorTag,
  endop: defineOperatorTag,
  String: t.string,
  LineComment: commentTag,
  BlockComment: commentTag,
  Opcode: opcodeTag,
  ScoreOperator: opcodeTag,
  init: opcodeTag,
  AmbiguousIdentifier: variableTag,
  XmlCsoundSynthesizerOpen: xmlTag,
  XmlCsoundSynthesizerClose: xmlTag,
  XmlCsOptionsOpen: xmlTag,
  XmlCsOptionsClose: xmlTag,
  XmlCsInstrumentsOpen: xmlTag,
  XmlCsInstrumentsClose: xmlTag,
  XmlCsScoreOpen: xmlTag,
  XmlCsScoreClose: xmlTag,
  ArrayBrackets: bracketTag,
  true: controlFlowTag,
  false: controlFlowTag,
  break: controlFlowTag,
  continue: controlFlowTag,
  for: controlFlowTag,
  in: controlFlowTag,
  switch: controlFlowTag,
  endswitch: controlFlowTag,
  case: controlFlowTag,
  DefaultLabel: controlFlowTag,
  if: controlFlowTag,
  do: controlFlowTag,
  fi: controlFlowTag,
  while: controlFlowTag,
  ControlFlowDoToken: controlFlowTag,
  ControlFlowGotoToken: controlFlowTag,
  ControlFlowEndToken: controlFlowTag,
  ControlFlowElseIfToken: controlFlowTag,
  ControlFlowElseToken: controlFlowTag,
  MacroOp: macroTag,
  '(': bracketTag,
  ')': bracketTag,
  '[': bracketTag,
  ']': bracketTag,
  '{': bracketTag,
  '}': bracketTag,
});

function decorateAmbigiousToken(token: string, parentToken: string) {
  if (isGlobalConstant(token)) {
    return globalConstantDecoration;
  } else if (
    parentToken === 'CallbackExpression' ||
    builtinOpcodes[token.replace(/:.*/, '')]
  ) {
    return opcodeDecoration;
  } else if (['XmlOpen', 'XmlClose'].includes(parentToken)) {
    return xmlTagDecoration;
  } else if (/^p\d+$/.test(token)) {
    return pFieldVarDecoration;
  } else if (token.startsWith('a')) {
    return aRateVarDecoration;
  } else if (token.startsWith('k')) {
    return kRateVarDecoration;
  } else if (token.startsWith('S')) {
    return sRateVarDecoration;
  } else if (token.startsWith('ga')) {
    return gaRateVarDecoration;
  } else if (token.startsWith('gk')) {
    return gkRateVarDecoration;
  } else if (token.startsWith('gS')) {
    return gsRateVarDecoration;
  } else if (token.startsWith('f')) {
    return fRateVarDecoration;
  } else if (token.startsWith('gf')) {
    return gfRateVarDecoration;
  } else if (/^\$.+/.test(token)) {
    return macroTokenDecoration;
  } else if (token.startsWith('gi')) {
    return giRateVarDecoration;
  } else if (token.endsWith(':')) {
    return gotoTokenDecoration;
  } else {
    return iRateVarDecoration;
  }
}

export function variableHighlighter(view: EditorView) {
  const builder = new RangeSetBuilder();
  for (const { from, to } of view.visibleRanges) {
    if (syntaxTreeAvailable(view.state, to)) {
      syntaxTree(view.state).iterate({
        from,
        to,
        enter: (cursor) => {
          if (cursor.name === 'AmbiguousIdentifier') {
            const tokenSlice = view.state.doc.slice(cursor.from, cursor.to);
            const token = (tokenSlice as any).text[0];
            if (['include'].includes(token)) {
              return;
            }

            if (cursor.node.parent?.name) {
              const maybeDecoration = decorateAmbigiousToken(
                token,
                cursor.node.parent.name,
              );
              if (maybeDecoration) {
                builder.add(cursor.from, cursor.to, maybeDecoration);
              }
            }
          }
        },
      });
    }
  }
  return builder.finish();
}

const defaultCsoundThemeStyles = new StyleModule({
  [`.${globalVarCssClassName}`]: {
    fontWeight: 600,
  },
  [`.${iRateVarCssClassName}`]: {
    color: '#29A8FF',
  },
  [`.${opcodeCssClassName}`]: {
    color: '#005cc5',
  },
  [`.${globalConstantCssClassName}`]: {
    color: '#22863a',
  },
  [`.${aRateVarCssClassName}`]: {
    color: '#6237FF',
  },
  [`.${kRateVarCssClassName}`]: {
    color: '#6C82AB',
  },
  [`.${sRateVarCssClassName}`]: {
    color: '#a11',
  },
  [`.${fRateVarCssClassName}`]: {
    color: '#004761',
  },
  [`.${pFieldVarCssClassName}`]: {
    color: '#FF9D0C',
    fontWeight: 600,
  },
  [`.${xmlTagCssClassName}`]: {
    color: '#22863a',
  },
  [`.${gotoTokenDecoration}`]: {
    color: '#59648B',
    fontWeight: 600,
  },
  [`.${commentCssClassName}`]: {
    color: 'gray',
  },
});

StyleModule.mount(document, defaultCsoundThemeStyles);

const defaultCsoundLightThemeTagStyles = HighlightStyle.define(
  [
    { tag: opcodeTag, color: '#005cc5', class: `${opcodeCssClassName}` },
    { tag: defineOperatorTag, color: '#6f42c1', class: 'cm-csound-define' },
    { tag: bracketTag, color: '#22863a', class: 'cm-csound-bracket' },
    { tag: controlFlowTag, color: '#22863a', class: 'cm-csound-control-flow' },
    { tag: xmlTag, color: '#22863a', class: xmlTagCssClassName },
    { tag: commentTag, color: 'gray', class: commentCssClassName },
    { tag: t.string, color: '#a11', class: sRateVarCssClassName },
    { tag: macroTag, color: 'red', class: 'cm-csound-macro' },
  ],
  { themeType: 'light' },
);

export const defaultCsoundLightTheme = syntaxHighlighting(
  defaultCsoundLightThemeTagStyles,
  //   { fallback: true },
);

const commaHtml = `<span style="margin-right: 5px;">, </span>`;

const makeComment = (commentText: string) =>
  `<span class="${commentCssClassName}">// ${commentText}</span>`;

const removeLastComma = (htmlString: string) =>
  htmlString.replace(/, <\/span>.?$/, ' </span>').replace(/,$/, '');

const removeLastCommaAndSpace = (htmlString: string) =>
  htmlString.replace(/, <\/span>.?$/, '</span>').replace(/,$/, '');

export const htmlizeSynopsis = (
  synopString: string,
  operatorName: string,
  isFunctionSyntax: boolean,
): string => {
  let body = '';
  const maybeCommentPos = synopString.indexOf(')');
  const needsFunctionalSyntaxRewrite = isFunctionSyntax && maybeCommentPos < 0;
  let maybeReturnTypeComment = '';
  const synopStringClean =
    maybeCommentPos > 0
      ? synopString.substring(0, maybeCommentPos + 1)
      : synopString;
  const splitSynopString = synopStringClean
    .replaceAll('[]', ';ARRAY;')
    .replace(/[,\[\]\.]/g, ' ')
    .replaceAll('(', ' (')
    .replace(/\s\s+/g, ' ')
    .replaceAll(';ARRAY;', '[]')
    .split(' ');
  for (const token of splitSynopString) {
    if (token) {
      if (token === operatorName) {
        if (needsFunctionalSyntaxRewrite) {
          maybeReturnTypeComment =
            `<span style="margin: 0 6px"></span>` +
            makeComment(`returns ${removeLastCommaAndSpace(body)}`);
          body = `<span class="${opcodeCssClassName}" style="font-weight: 700;">${token}</span>(`;
        } else {
          body = `${removeLastComma(
            body,
          )} <span class="${opcodeCssClassName}" style="font-weight: 700; margin-right: 3px;">${token}</span>`;
        }
      } else if (token.startsWith('a')) {
        body = `${body} <span class="${aRateVarCssClassName}">${token}</span>${commaHtml}`;
      } else if (token.startsWith('k')) {
        body = `${body} <span class="${kRateVarCssClassName}">${token}</span>${commaHtml}`;
      } else if (token.startsWith('"') || token.startsWith('S')) {
        body = `${body} <span class="${sRateVarCssClassName}">${token}</span>${commaHtml}`;
      } else if (token.startsWith('i')) {
        body = `${body} <span class="${iRateVarCssClassName}">${token}</span>${commaHtml}`;
      } else {
        body = `${body} ${token}${commaHtml}`;
      }
    }
  }

  const maybeComment =
    maybeCommentPos > 0 && synopString.substring(maybeCommentPos + 1);

  return `<p style="margin: 0; padding: 0; margin-left: 2px;">${removeLastCommaAndSpace(
    body,
  )}${needsFunctionalSyntaxRewrite ? ')' : ''}${
    maybeComment ? makeComment(maybeComment) : ''
  }${maybeReturnTypeComment}</p>`;
};
