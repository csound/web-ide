/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    LRLanguage,
    LanguageSupport,
    foldNodeProp,
    foldInside,
    indentUnit,
    indentNodeProp,
    syntaxTree,
    syntaxTreeAvailable
} from "@codemirror/language";
import { completeFromList } from "@codemirror/autocomplete";
import { Tag, styleTags, tags as t } from "@lezer/highlight";
import { Decoration, ViewPlugin, showPanel } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { createRoot } from "react-dom/client";
import { debounce } from "throttle-debounce";
import { renderFtgenPlotterElement, isFtgenPlottable } from "./ftgen-plotter";
import { renderSynopsis } from "./render-synopsis";
import { resolveExpressionFromNode } from "./parser-utils";
import { parser } from "./syntax.grammar";

window.editorCursorState = {};

const storeCursor = debounce(100, (callback) => {
    if (typeof callback === "function") {
        callback();
    }
});

export const opcodeTag = Tag.define();
export const xmlTag = Tag.define();
export const bracketTag = Tag.define();
export const defineOperatorTag = Tag.define();
export const controlFlowTag = Tag.define();
export const ambiguousTag = Tag.define();

const csoundTags = styleTags({
    instr: defineOperatorTag,
    endin: defineOperatorTag,
    opcode: defineOperatorTag,
    endop: defineOperatorTag,
    String: t.string,
    LineComment: t.lineComment,
    BlockComment: t.comment,
    Opcode: opcodeTag,
    init: opcodeTag,
    AmbiguousIdentifier: ambiguousTag,
    XmlCsoundSynthesizerOpen: xmlTag,
    XmlOpen: xmlTag,
    XmlClose: xmlTag,
    ArrayBrackets: bracketTag,
    if: controlFlowTag,
    do: controlFlowTag,
    fi: controlFlowTag,
    while: controlFlowTag,
    ControlFlowDoToken: controlFlowTag,
    ControlFlowGotoToken: controlFlowTag,
    ControlFlowEndToken: controlFlowTag,
    ControlFlowElseIfToken: controlFlowTag,
    ControlFlowElseToken: controlFlowTag,
    "(": bracketTag,
    ")": bracketTag,
    "[": bracketTag,
    "]": bracketTag,
    "{": bracketTag,
    "}": bracketTag
});

const globalConstantDecoration = Decoration.mark({
    attributes: { class: "cm-csound-global-constant" }
});

const opcodeDecoration = Decoration.mark({
    attributes: { class: "cm-csound-opcode" }
});

const aRateVarDecoration = Decoration.mark({
    attributes: { class: "cm-csound-a-rate-var" }
});

const gaRateVarDecoration = Decoration.mark({
    attributes: {
        class: ["cm-csound-a-rate-var", "cm-csound-global-var"].join(" ")
    }
});

const kRateVarDecoration = Decoration.mark({
    attributes: { class: "cm-csound-k-rate-var" }
});

const gkRateVarDecoration = Decoration.mark({
    attributes: {
        class: ["cm-csound-k-rate-var", "cm-csound-global-var"].join(" ")
    }
});

const sRateVarDecoration = Decoration.mark({
    attributes: { class: "cm-csound-s-rate-var" }
});

const gsRateVarDecoration = Decoration.mark({
    attributes: {
        class: ["cm-csound-s-rate-var", "cm-csound-global-var"].join(" ")
    }
});

const fRateVarDecoration = Decoration.mark({
    attributes: { class: "cm-csound-f-rate-var" }
});

const gfRateVarDecoration = Decoration.mark({
    attributes: { class: ["cm-csound-f-rate-var", "cm-csound-global-var"] }
});

const pFieldVarDecoration = Decoration.mark({
    attributes: { class: "cm-csound-p-field-var" }
});

const xmlTagDecoration = Decoration.mark({
    attributes: { class: "cm-csound-xml-tag" }
});

const gotoTokenDecoration = Decoration.mark({
    attributes: { class: "cm-csound-goto-token" }
});

const macroTokenDecoration = Decoration.mark({
    attributes: { class: "cm-csound-macro-token" }
});

function isGlobalConstant(token) {
    return ["sr", "kr", "ksmps", "0dbfs", "nchnls", "nchnls_i"].includes(token);
}

function decorateAmbigiousToken(token, parentToken) {
    if (isGlobalConstant(token)) {
        return globalConstantDecoration;
    } else if (
        parentToken === "CallbackExpression" ||
        (Array.isArray(window.csoundBuiltinOpcodes) &&
            window.csoundBuiltinOpcodes.includes(token.replace(/:.*/, "")))
    ) {
        return opcodeDecoration;
    } else if (["XmlOpen", "XmlClose"].includes(parentToken)) {
        return xmlTagDecoration;
    } else if (/^p\d+$/.test(token)) {
        return pFieldVarDecoration;
    } else if (token.startsWith("a")) {
        return aRateVarDecoration;
    } else if (token.startsWith("k")) {
        return kRateVarDecoration;
    } else if (token.startsWith("S")) {
        return sRateVarDecoration;
    } else if (token.startsWith("ga")) {
        return gaRateVarDecoration;
    } else if (token.startsWith("gk")) {
        return gkRateVarDecoration;
    } else if (token.startsWith("gS")) {
        return gsRateVarDecoration;
    } else if (token.startsWith("f")) {
        return fRateVarDecoration;
    } else if (token.startsWith("gf")) {
        return gfRateVarDecoration;
    } else if (/^\$.+/.test(token)) {
        return macroTokenDecoration;
    }
}

function variableHighlighter(view) {
    const builder = new RangeSetBuilder();
    for (const { from, to } of view.visibleRanges) {
        if (syntaxTreeAvailable(view.state, to)) {
            syntaxTree(view.state).iterate({
                from,
                to,
                enter: (cursor) => {
                    if (cursor.name === "AmbiguousIdentifier") {
                        // console.log(cursor.node);
                        const tokenSlice = view.state.doc.slice(
                            cursor.from,
                            cursor.to
                        );
                        const token = tokenSlice.text[0];

                        const maybeDecoration = decorateAmbigiousToken(
                            token,
                            cursor.node.parent.name
                        );

                        if (maybeDecoration) {
                            builder.add(
                                cursor.from,
                                cursor.to,
                                maybeDecoration
                            );
                        }
                    }
                }
            });
        }
    }
    return builder.finish();
}

const findOperatorName = (view, tree) => {
    const treeRoot = tree.node;
    let maybeArgList = treeRoot;
    let maybeArgListNode = tree.node;

    while (maybeArgList && maybeArgList.type.name !== "ArgList") {
        maybeArgListNode = maybeArgList?.node?.parent ?? maybeArgList.node;
        maybeArgList = maybeArgList.node.parent;
    }

    if (
        maybeArgList &&
        maybeArgList.node?.parent?.type.name === "CallbackExpression"
    ) {
        const tokenSlice = view.state.doc.slice(
            maybeArgList.node.parent.from,
            maybeArgList.node.parent.to
        );
        const token = tokenSlice.text[0].replace(/:.*/, "").replace(/\(.*/, "");

        return {
            token,
            statement: tokenSlice,
            treeNode: maybeArgListNode.node.parent.node
        };
    }

    let maybeOpcodeStatement = treeRoot;
    let maybeOpcodeStatementNode = treeRoot;

    while (
        maybeOpcodeStatement &&
        maybeOpcodeStatement.type.name !== "OpcodeStatement"
    ) {
        maybeOpcodeStatementNode =
            maybeOpcodeStatement?.node?.parent ?? maybeOpcodeStatement.node;
        maybeOpcodeStatement = maybeOpcodeStatement.node.parent;
    }

    if (maybeOpcodeStatement) {
        const tokenSlice = view.state.doc.slice(
            maybeOpcodeStatement.from,
            maybeOpcodeStatement.to
        );

        const splitStatement = tokenSlice.text[0].split(/\s/);
        const result = splitStatement.reduce(
            ({ cand, stop, lastComma }, curr) => {
                if (stop) {
                    return {
                        cand,
                        stop,
                        lastComma
                    };
                } else {
                    if (curr.includes(",")) {
                        return {
                            cand: undefined,
                            stop: false,
                            lastComma: true
                        };
                    } else if (lastComma) {
                        return {
                            cand: undefined,
                            stop: false,
                            lastComma: false
                        };
                    } else {
                        const tokenExists = window.csoundSynopsis.some(
                            (value) => value.opname === curr
                        );

                        return tokenExists
                            ? { cand: curr, stop: true, lastComma: true }
                            : { cand, stop: false, lastComma: false };
                    }
                }
            },
            { cand: undefined, stop: false, lastComma: false }
        );

        return {
            token: result.cand,
            statement: tokenSlice,
            treeNode: maybeOpcodeStatementNode
        };
    }

    return {};
};

const csoundInfoPanel = (view) => {
    const dom = document.createElement("div");
    let root = createRoot(dom);

    const unmount = () => {
        if (root && typeof root.unmount === "function") {
            try {
                setTimeout(() => {
                    typeof root.unmount === "function" && root.unmount();
                    root = undefined;
                }, 0);
            } catch {}
        }
    };
    return {
        dom,
        destroy() {
            unmount();
        },
        update(update) {
            if (update.heightChanged || update.selectionSet) {
                const isEmptyLine =
                    view.lineBlockAt(view.state.selection.main.to).length < 2;

                if (isEmptyLine) {
                    renderSynopsis({ root, synopsis: "" });
                    return;
                }

                const treeRoot = syntaxTree(view.state).cursorAt(
                    view.state.selection.main.head
                );
                const {
                    token: operatorName,
                    statement,
                    treeNode
                } = findOperatorName(view, treeRoot);
                const synopsis =
                    operatorName &&
                    window.csoundSynopsis.find(
                        (value) => value.opname === operatorName
                    );

                const hasSynopsis =
                    Boolean(synopsis) &&
                    Array.isArray(synopsis.synopsis) &&
                    synopsis.synopsis.length > 0;

                const isPlottable =
                    hasSynopsis && isFtgenPlottable(operatorName);

                if (hasSynopsis && isPlottable) {
                    const statementObject = resolveExpressionFromNode(
                        view,
                        treeNode
                    );
                    renderFtgenPlotterElement({
                        root,
                        statement,
                        synopsis: synopsis.synopsis[0],
                        statementObject
                    });
                } else if (hasSynopsis) {
                    renderSynopsis({ root, synopsis: synopsis.synopsis[0] });
                } else {
                    renderSynopsis({ root, synopsis: "" });
                }
            }
        }
    };
};

const csoundInfo = () => {
    return showPanel.of(csoundInfoPanel);
};

const csoundModePlugin = ViewPlugin.fromClass(
    class {
        constructor(view) {
            const documentUidFieldState = view.state.values.find(
                (state) =>
                    state && typeof state === "object" && state.documentUid
            );

            if (
                typeof documentUidFieldState === "object" &&
                documentUidFieldState.documentUid
            ) {
                this.documentUid = documentUidFieldState.documentUid;
            }

            if (!this.initialized) {
                this.decorations = variableHighlighter(view);
                this.initialized = true;
            }
        }

        update(update) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = variableHighlighter(update.view);
            }

            if (!this.scrollPositionInitialized) {
                const view = update.view;
                view.focus();
                const documentUid = this.documentUid;

                if (
                    documentUid &&
                    typeof window.editorCursorState[
                        `${documentUid}:scrollTop`
                    ] === "number"
                ) {
                    view.requestMeasure({
                        read() {
                            return {
                                cursor: view.coordsAtPos(
                                    view.state.selection.main.head
                                ),
                                scroller: view.scrollDOM.getBoundingClientRect()
                            };
                        },
                        write() {
                            view.scrollDOM.scrollTop =
                                window.editorCursorState[
                                    `${documentUid}:scrollTop`
                                ];
                        }
                    });

                    if (
                        view.scrollDOM.scrollTop ===
                        window.editorCursorState[`${documentUid}:scrollTop`]
                    ) {
                        this.scrollPositionInitialized = true;
                    }
                } else {
                    this.scrollPositionInitialized = true;
                }
            }
        }
    },
    {
        decorations: (v) => v.decorations,
        eventHandlers: {
            scroll: function (_, view) {
                const documentUid = this.documentUid;
                if (documentUid && view.scrollDOM.scrollTop > 0) {
                    storeCursor(() => {
                        window.editorCursorState[`${documentUid}:scrollTop`] =
                            view.scrollDOM.scrollTop;
                    });
                }
            }
        }
    }
);

export const orcLanguage = LRLanguage.define({
    dialect: "csd",
    parser: parser.configure({
        props: [
            csoundTags,
            indentNodeProp.add({
                InstrumentDeclaration: (context) =>
                    context.column(context.node.from) + context.unit,
                UdoDeclaration: (context) =>
                    context.column(context.node.from) + context.unit,
                ControlFlowStatement: (context) =>
                    context.column(context.node.from) + context.unit
            }),
            foldNodeProp.add({
                InstrumentDeclaration: foldInside,
                UdoDeclaration: foldInside
            })
        ]
        //strict: true
    }),
    languageData: {
        closeBrackets: { brackets: ["(", "[", "{", "'", '"'] },
        commentTokens: { line: "//", block: { open: "/*", close: "*/" } }
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
    return new LanguageSupport(csdLanguage, [
        completionList,
        csoundModePlugin,
        csoundInfo(),
        indentUnit.of("  ")
    ]);
}
