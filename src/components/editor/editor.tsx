import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    EditorView,
    drawSelection,
    keymap,
    lineNumbers
} from "@codemirror/view";
import { autocompletion } from "@codemirror/autocomplete";
import {
    defaultKeymap,
    history,
    historyKeymap,
    indentWithTab
} from "@codemirror/commands";
import { bracketMatching, syntaxHighlighting } from "@codemirror/language";
import { EditorState, StateField } from "@codemirror/state";
// import { editorEvalCode, uncommentLine } from "./utils";
import { debounce } from "throttle-debounce";
import { IDocument, IProject } from "../projects/types";
// import { ICsoundStatus } from "@comp/csound/types";
// import { CsoundObj } from "@csound/browser";
import { pathOr, propOr } from "ramda";
import * as projectActions from "../projects/actions";
import * as projectEditorActions from "../project-editor/actions";
import { filenameToCsoundType } from "@comp/csound/utils";
import {
    monokaiEditor,
    monokaiHighlightStyle
} from "@styles/code-mirror-painter";
import { csoundMode } from "./modes/csound/csound";

declare global {
    interface Window {
        csoundSynopsis: any;
        csoundBuiltinOpcodes: any;
    }
}

const cursorState = {};

// const onScroll = debounce(100, (editor: any) => {
//     const documentUid = editor.state.documentUid;
//     if (documentUid) {
//         cursorState[`${documentUid}:scrollTop`] = (editor as any).doc.scrollTop
//             ? (editor as any).doc.scrollTop
//             : 0;
//     }
// });

let updateReduxDocumentValue;

// const autoLanguage = EditorState.transactionExtender.of((tr) => {
//     if (!tr.docChanged) return null;
//     let docIsHTML = /^\s*</.test(tr.newDoc.sliceString(0, 100));
//     let stateIsHTML = tr.startState.facet(language) == htmlLanguage;
//     if (docIsHTML == stateIsHTML) return null;
//     return {
//         effects: languageConf.reconfigure(docIsHTML ? html() : javascript())
//     };
// });

const CodeEditor = ({
    documentUid,
    projectUid,
    isOwner
}: {
    documentUid: string;
    projectUid: string;
    isOwner: boolean;
}): React.ReactElement => {
    const [isMounted, setIsMounted] = useState(false);
    const [hasSynopsis, setHasSynopsis] = useState(false);

    const [editorReference, setEditorReference]: [
        EditorView | undefined,
        (argument: EditorView) => void
    ] = useState();

    const [, setEditorState]: [
        EditorState | undefined,
        (argument: EditorState) => void
    ] = useState();

    const [onChangedCallback, setOnChangedCallback]: [
        ((cm: EditorView) => void) | undefined,
        any
    ] = useState();

    const textfieldReference = useRef(null);

    const dispatch = useDispatch();

    const onUnmount = useCallback(() => {
        dispatch(
            projectEditorActions.storeEditorInstance(
                undefined,
                projectUid,
                documentUid
            )
        );
        if (editorReference && onChangedCallback) {
            // editorReference.off("change", onChangedCallback);
        }

        if (editorReference) {
            // editorReference.off("scroll", onScroll);
            cursorState[`${documentUid}:anchor`] =
                editorReference.state.selection.main.anchor;
            // cursorState[`${documentUid}:history`] =
            //     editorReference.getHistory();
        }
        updateReduxDocumentValue && updateReduxDocumentValue.cancel();
    }, [dispatch, projectUid, documentUid, editorReference, onChangedCallback]);

    useEffect(() => {
        if (!window.csoundSynopsis) {
            fetch("/static-manual-index.json")
                .then(async (response) => {
                    const csoundSynopsis: any = await response.json();
                    window.csoundSynopsis = csoundSynopsis;
                    window.csoundBuiltinOpcodes = csoundSynopsis.map(
                        ({ opname }) => opname
                    );
                    setHasSynopsis(true);
                })
                .catch((error: any) =>
                    console.error(
                        "Error while getting static-manual-index.json",
                        error
                    )
                );
        } else {
            setHasSynopsis(true);
        }

        return () => {
            textfieldReference && isMounted && onUnmount();
        };
    }, [textfieldReference, isMounted, onUnmount, setHasSynopsis]);

    const activeProjectUid = useSelector(
        pathOr("", ["ProjectsReducer", "activeProjectUid"])
    );

    const project = useSelector(
        pathOr({} as IProject, [
            "ProjectsReducer",
            "projects",
            activeProjectUid
        ])
    );

    const document = pathOr(
        {} as IDocument,
        ["documents", documentUid],
        project
    );

    const currentDocumentValue: string = propOr("", "currentValue", document);
    const maybeCsoundFile = filenameToCsoundType(document.filename);
    const documentType: string = maybeCsoundFile ? maybeCsoundFile : "txt";

    useEffect(() => {
        if (
            !isMounted &&
            hasSynopsis &&
            textfieldReference &&
            textfieldReference.current
        ) {
            const documentUdField = StateField.define({
                create: () => ({ documentUid }),
                update: () => ({ documentUid })
            });
            const initialState = EditorState.create({
                doc: currentDocumentValue,

                extensions: [
                    syntaxHighlighting(monokaiHighlightStyle, {
                        fallback: true
                    }),
                    drawSelection(),
                    csoundMode(),
                    history(),
                    keymap.of([
                        ...defaultKeymap,
                        ...historyKeymap,
                        indentWithTab
                    ]),
                    lineNumbers(),
                    bracketMatching(),
                    monokaiEditor,
                    autocompletion(),
                    documentUdField
                ]
            });

            (initialState as any).documentUid = documentUid;

            const editor = new EditorView(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion

                {
                    parent: textfieldReference.current!,
                    state: initialState
                    // lineWrapping: true
                    // extensions: {
                    //     autoCloseBrackets: true,
                    // autoSuggest: true,
                    // fullScreen: false,
                    // height: "auto",
                    // lineNumbers: true,
                    // lineWrapping: true,
                    // matchBrackets: true,
                    // viewportMargin: Number.POSITIVE_INFINITY,
                    // scrollbarStyle: "simple",
                    // extraKeys: {
                    //     // noop default keybindings and handle from react
                    //     // all defaults: code-mirror/src/input/keymap.js
                    //     // eslint-disable-next-line @typescript-eslint/no-empty-function
                    //     "Ctrl-F": () => {},
                    //     // eslint-disable-next-line @typescript-eslint/no-empty-function
                    //     "Cmd-F": () => {},
                    //     // eslint-disable-next-line @typescript-eslint/no-empty-function
                    //     "Ctrl-Z": () => {},
                    //     // eslint-disable-next-line @typescript-eslint/no-empty-function
                    //     "Cmd-Z": () => {},
                    //     // eslint-disable-next-line @typescript-eslint/no-empty-function
                    //     "Shift-Ctrl-Z": () => {},
                    //     // eslint-disable-next-line @typescript-eslint/no-empty-function
                    //     "Ctrl-Y": () => {},
                    //     // eslint-disable-next-line @typescript-eslint/no-empty-function
                    //     "Shift-Cmd-Z": () => {},
                    //     // eslint-disable-next-line @typescript-eslint/no-empty-function
                    //     "Cmd-Y": () => {}
                    // },
                    // mode: ["csd", "orc", "sco", "udo"].includes(
                    //     documentType
                    // )
                    //     ? { name: "csound", documentType }
                    //     : "text/plain"
                    // }
                }
            );
            setEditorReference(editor);
            setEditorState(initialState);

            dispatch(
                projectEditorActions.storeEditorInstance(
                    editor,
                    projectUid,
                    documentUid
                )
            );
            editor.focus();
            const lastAnchor = propOr(0, `${documentUid}:anchor`, cursorState);
            // const lastColumn = pathOr(
            //     0,
            //     [`${documentUid}:cursor_pos`, "ch"],
            //     cursorState
            // );

            (editor.state as any).documentUid = documentUid;

            editor.dispatch({
                selection: { anchor: lastAnchor }
            });

            // const lastScrollTop = cursorState[`${documentUid}:scrollTop`] || 0;
            // editor.scrollTo(0, lastScrollTop);

            setIsMounted(true);
            updateReduxDocumentValue = debounce(
                100,
                (newValue, projectUid, documentUid, dispatch) => {
                    dispatch(
                        projectActions.updateDocumentValue(
                            newValue,
                            projectUid,
                            documentUid
                        )
                    );
                }
            );
            const changeCallback = function (cm) {
                cm &&
                    updateReduxDocumentValue(
                        cm.getValue(),
                        projectUid,
                        documentUid,
                        dispatch
                    );
            };
            setOnChangedCallback(changeCallback);
            // editor.on("change", changeCallback);
            // editor.on("scroll", onScroll);
        }
    }, [
        currentDocumentValue,
        dispatch,
        documentUid,
        projectUid,
        isMounted,
        setIsMounted,
        documentType,
        hasSynopsis,
        setHasSynopsis
    ]);

    return typeof currentDocumentValue === "string" && hasSynopsis ? (
        <div ref={textfieldReference} style={{ height: "100%" }} />
    ) : (
        <></>
    );
};

export default CodeEditor;
