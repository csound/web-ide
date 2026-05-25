import {
  LRLanguage,
  LanguageSupport,
  foldNodeProp,
  foldInside,
  indentUnit,
  indentNodeProp,
  syntaxTree,
} from '@codemirror/language';
import { completeFromList, ifIn } from '@codemirror/autocomplete';
import { SyntaxNode, TreeCursor } from '@lezer/common';
import {
  PanelConstructor,
  ViewPlugin,
  showPanel,
  EditorView,
} from '@codemirror/view';
import { Extension } from '@codemirror/state';
import {
  csoundTags,
  defaultCsoundLightTheme,
  htmlizeSynopsis,
  variableHighlighter,
} from './highlighter';
import { parser as csdParser } from './csd.grammar';
import { parser as orcParser } from './orc.grammar';
import { parser as scoParser } from './sco.grammar';
import { builtinOpcodes } from './parser-utils';

const csoundModePlugin: Extension = ViewPlugin.fromClass(
  class {
    public view: EditorView;
    constructor(view: EditorView) {
      this.view = view;
    }
    get decorations() {
      return variableHighlighter(this.view);
    }
  },
  {
    decorations: ({ view }: { view: EditorView }) => {
      return variableHighlighter(view) as any;
    },
  },
);

type LineReducer = {
  cand: string | undefined;
  stop: boolean;
  lastComma: boolean;
};

const findOperatorName = (view: EditorView, tree: TreeCursor) => {
  const treeRoot = tree.node;
  let maybeArgList: SyntaxNode | null = treeRoot;
  let maybeArgListNode: SyntaxNode | null = tree.node;

  while (maybeArgList && maybeArgList.type.name !== 'ArgList') {
    maybeArgListNode = maybeArgList?.node?.parent ?? maybeArgList.node;
    maybeArgList = maybeArgList.node.parent;
  }

  if (
    maybeArgList &&
    maybeArgList.node?.parent?.type.name === 'CallbackExpression'
  ) {
    const tokenSlice = view.state.doc.slice(
      maybeArgList.node.parent.from,
      maybeArgList.node.parent.to,
    );

    const tokenFull = (tokenSlice as any).text[0].replace(/\(.*/, '');

    const token = tokenFull.replace(/:.*/, '');
    const explicitRate =
      tokenFull.indexOf(':') > -1
        ? tokenFull.replace(/.*:/, '').replace(/ /g, '')
        : undefined;

    return {
      token,
      explicitRate,
      statement: tokenSlice,
      treeNode: maybeArgListNode.node.parent?.node ?? null,
    };
  }

  let maybeOpcodeStatement: SyntaxNode | null = treeRoot;
  let maybeOpcodeStatementNode: SyntaxNode | null = treeRoot;

  while (
    maybeOpcodeStatement &&
    maybeOpcodeStatement.type.name !== 'OpcodeStatement'
  ) {
    maybeOpcodeStatementNode =
      maybeOpcodeStatement?.node?.parent ?? maybeOpcodeStatement.node;
    maybeOpcodeStatement = maybeOpcodeStatement.node.parent;
  }

  if (maybeOpcodeStatement) {
    const tokenSlice = view.state.doc.slice(
      maybeOpcodeStatement.from,
      maybeOpcodeStatement.to,
    );

    const splitStatement = (tokenSlice as any).text[0].split(/\s/);
    const result = splitStatement.reduce(
      ({ cand, stop, lastComma }: LineReducer, curr: string) => {
        if (stop) {
          return {
            cand,
            stop,
            lastComma,
          };
        } else {
          if (curr.includes(',')) {
            return {
              cand: undefined,
              stop: false,
              lastComma: true,
            };
          } else if (lastComma) {
            return {
              cand: undefined,
              stop: false,
              lastComma: false,
            };
          } else {
            const tokenExists = builtinOpcodes[curr] !== undefined;

            return tokenExists
              ? { cand: curr, stop: true, lastComma: true }
              : { cand, stop: false, lastComma: false };
          }
        }
      },
      { cand: undefined, stop: false, lastComma: false } as LineReducer,
    );

    return {
      token: result.cand,
      statement: tokenSlice,
      treeNode: maybeOpcodeStatementNode,
    };
  }

  return {};
};

const csoundInfoPanel: PanelConstructor = (view: EditorView) => {
  const dom = document.createElement('div');

  return {
    dom,
    destroy() {
      dom.remove();
    },
    update(update) {
      if (update.heightChanged || update.selectionSet) {
        const isEmptyLine =
          view.lineBlockAt(view.state.selection.main.to).length < 2;
        if (isEmptyLine) {
          dom.innerHTML = '';
          return;
        }
        const treeRoot = syntaxTree(view.state).cursorAt(
          view.state.selection.main.head,
        );
        const { token: operatorName, explicitRate } = findOperatorName(
          view,
          treeRoot,
        );
        const synopsis = operatorName && builtinOpcodes[operatorName];
        const hasSynopsis =
          Boolean(synopsis) &&
          Array.isArray(synopsis.synopsis) &&
          synopsis.synopsis.length > 0;
        if (hasSynopsis) {
          let isFunctionSyntax = false;
          let foundExpressionType = false;
          let currentNode = treeRoot.node.parent;

          while (!foundExpressionType && currentNode) {
            if (
              ['CallbackExpression', 'ArgList'].includes(
                currentNode.type.name || '',
              )
            ) {
              isFunctionSyntax = true;
              foundExpressionType = true;
            } else if (currentNode.type.name === 'OpcodeStatement') {
              isFunctionSyntax = false;
              foundExpressionType = true;
            }
            currentNode = currentNode.parent;
          }

          let resolvedSynopsis = synopsis.synopsis[0];
          if (explicitRate && Array.isArray(synopsis.synopsis)) {
            for (const synop of synopsis.synopsis) {
              if (synop.startsWith(explicitRate)) {
                resolvedSynopsis = synop;
              }
            }
          }

          dom.innerHTML = htmlizeSynopsis(
            resolvedSynopsis,
            operatorName,
            isFunctionSyntax,
          );
        } else {
          dom.innerHTML = '';
        }
      }
    },
  };
};

const csoundInfo = () => {
  return showPanel.of(csoundInfoPanel);
};

function foldInstrInside(
  node: SyntaxNode,
): { from: number; to: number } | null {
  let first = node.firstChild;
  if (first?.nextSibling) {
    first = first.nextSibling;
  }
  const last = node.lastChild;
  return first && first.to < last!.from
    ? { from: first.to, to: last!.type.isError ? node.to : last!.from }
    : null;
}

export const csdLanguage = LRLanguage.define({
  parser: csdParser.configure({
    props: [
      csoundTags,
      indentNodeProp.add({
        InstrumentDeclaration: (context) =>
          context.column(context.node.from) + context.unit,
        UdoDeclaration: (context) =>
          context.column(context.node.from) + context.unit,
        ControlFlowStatement: (context) =>
          context.column(context.node.from) + context.unit,
      }),
      foldNodeProp.add({
        InstrumentDeclaration: foldInstrInside,
        UdoDeclaration: foldInstrInside,
        FoldableScoreStatement: foldInside,
      }),
    ],
  }),
  languageData: {
    closeBrackets: { brackets: ['(', '[', '{', "'", '"'] },
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
  },
});

export const orcLanguage = LRLanguage.define({
  parser: orcParser.configure({
    props: [
      csoundTags,
      indentNodeProp.add({
        InstrumentDeclaration: (context) =>
          context.column(context.node.from) + context.unit,
        UdoDeclaration: (context) =>
          context.column(context.node.from) + context.unit,
        ControlFlowStatement: (context) =>
          context.column(context.node.from) + context.unit,
      }),
      foldNodeProp.add({
        InstrumentDeclaration: foldInstrInside,
        UdoDeclaration: foldInstrInside,
      }),
    ],
  }),

  languageData: {
    closeBrackets: { brackets: ['(', '[', '{', "'", '"'] },
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
  },
});

export const scoLanguage = LRLanguage.define({
  parser: scoParser.configure({
    props: [
      csoundTags,
      foldNodeProp.add({
        FoldableScoreStatement: foldInside,
      }),
    ],
  }),
  languageData: {
    closeBrackets: { brackets: ['(', '[', '{', "'", '"'] },
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
  },
});

//,
// const orchestraAutocompletion = autocompletion({
//   activateOnTyping: true,
//   selectOnOpen: true,
// });

const completionList = csdLanguage.data.of({
  autocomplete: ifIn(
    ['Orchestra'],
    completeFromList(Object.keys(builtinOpcodes)),
  ),
});

interface CsoundModeOptions {
  enableCompletion?: boolean;
  enableSynopsis?: boolean;
  enableDefaultTheme?: boolean;
  fileType?: 'csd' | 'orc' | 'sco';
}

export function csoundMode(options?: CsoundModeOptions) {
  const {
    fileType = 'csd',
    enableSynopsis = true,
    enableCompletion = true,
    enableDefaultTheme = true,
  } = options || {};
  let selectedLanguageVariant = csdLanguage;
  const features = [csoundModePlugin, indentUnit.of('  ')];

  if (enableSynopsis) {
    features.push(csoundInfo());
  }

  if (enableCompletion) {
    features.push(completionList);
  }

  if (enableDefaultTheme) {
    features.push(defaultCsoundLightTheme);
  }

  if (fileType === 'orc') {
    selectedLanguageVariant = orcLanguage;
  }

  if (fileType === 'sco') {
    selectedLanguageVariant = scoLanguage;
  }

  return new LanguageSupport(selectedLanguageVariant, features);
}
