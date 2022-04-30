import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import CodeMirror from "codemirror";
// import { editorEvalCode, uncommentLine } from "./utils";
import { debounce } from "throttle-debounce";
import { IDocument, IProject } from "../projects/types";
// import { ICsoundStatus } from "@comp/csound/types";
// import { CsoundObj } from "@csound/browser";
import { pathOr, propOr } from "ramda";
import * as projectActions from "../projects/actions";
import * as projectEditorActions from "../project-editor/actions";
import { filenameToCsoundType } from "@comp/csound/utils";
import { registerCsoundMode } from "./modes/csound/csound";
import * as SS from "./styles";
import "./plugins/autosuggest";
import "codemirror/addon/comment/comment";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/search/search";
import "codemirror/addon/search/searchcursor";
import "codemirror/addon/search/jump-to-line";
import "codemirror/addon/search/matchesonscrollbar";
import "codemirror/addon/search/matchesonscrollbar.css";
import "codemirror/addon/dialog/dialog";
import "codemirror/addon/dialog/dialog.css";
import "codemirror/keymap/vim";
import "codemirror/keymap/emacs";
import "codemirror/addon/scroll/simplescrollbars";
import "codemirror/addon/scroll/simplescrollbars.css";
import "codemirror/lib/codemirror.css";

registerCsoundMode(CodeMirror);

declare global {
    interface Window {
        csoundSynopsis: any;
    }
}

const cursorState = {};

const onScroll = debounce(100, (editor: any) => {
    const documentUid = editor.state.documentUid;
    if (documentUid) {
        cursorState[`${documentUid}:scrollTop`] = (editor as any).doc.scrollTop
            ? (editor as any).doc.scrollTop
            : 0;
    }
});

let updateReduxDocumentValue;

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
        CodeMirror.Editor | undefined,
        (argument: CodeMirror.Editor) => void
    ] = useState();

    const [onChangedCallback, setOnChangedCallback]: [
        ((cm: CodeMirror.Editor) => void) | undefined,
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
            editorReference.off("change", onChangedCallback);
        }

        if (editorReference) {
            editorReference.off("scroll", onScroll);
            cursorState[`${documentUid}:cursor_pos`] =
                editorReference.getCursor();
            cursorState[`${documentUid}:history`] =
                editorReference.getHistory();
        }
        updateReduxDocumentValue && updateReduxDocumentValue.cancel();
    }, [dispatch, projectUid, documentUid, editorReference, onChangedCallback]);

    useEffect(() => {
        if (!window.csoundSynopsis) {
            fetch("/static-manual-index.json").then(async (response) => {
                window.csoundSynopsis = await response.json();
                setHasSynopsis(true);
            });
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
            const editor = CodeMirror.fromTextArea(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                textfieldReference.current!,
                {
                    autoCloseBrackets: true,
                    autoSuggest: true,
                    fullScreen: false,
                    height: "auto",
                    lineNumbers: true,
                    lineWrapping: true,
                    matchBrackets: true,
                    viewportMargin: Number.POSITIVE_INFINITY,
                    scrollbarStyle: "simple",
                    extraKeys: {
                        // noop default keybindings and handle from react
                        // all defaults: code-mirror/src/input/keymap.js
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        "Ctrl-F": () => {},
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        "Cmd-F": () => {},
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        "Ctrl-Z": () => {},
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        "Cmd-Z": () => {},
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        "Shift-Ctrl-Z": () => {},
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        "Ctrl-Y": () => {},
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        "Shift-Cmd-Z": () => {},
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        "Cmd-Y": () => {}
                    },
                    mode: ["csd", "orc", "sco", "udo"].includes(documentType)
                        ? { name: "csound", documentType }
                        : "text/plain"
                } as any
            );

            setEditorReference(editor as any);

            dispatch(
                projectEditorActions.storeEditorInstance(
                    editor,
                    projectUid,
                    documentUid
                )
            );
            editor.focus();
            const lastLine = pathOr(
                0,
                [`${documentUid}:cursor_pos`, "line"],
                cursorState
            );
            const lastColumn = pathOr(
                0,
                [`${documentUid}:cursor_pos`, "ch"],
                cursorState
            );
            editor.state.documentUid = documentUid;

            editor.setCursor({ line: lastLine, ch: lastColumn });

            const lastScrollTop = cursorState[`${documentUid}:scrollTop`] || 0;
            editor.scrollTo(0, lastScrollTop);

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
            editor.on("change", changeCallback);
            editor.on("scroll", onScroll);
        }
    }, [
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
        <form style={{ overflowY: "hidden", height: "100%" }}>
            <textarea
                ref={textfieldReference}
                css={SS.root}
                style={{ fontSize: `16px !important` }}
                defaultValue={currentDocumentValue}
            ></textarea>
        </form>
    ) : (
        <></>
    );
};

export default CodeEditor;
