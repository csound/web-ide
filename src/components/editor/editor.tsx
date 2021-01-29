import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import CodeMirror from "codemirror";
// import { UnControlled } from "react-codemirror2";
import { editorEvalCode, uncommentLine } from "./utils";
import { debounce } from "throttle-debounce";
import { IDocument, IProject } from "../projects/types";
import { ICsoundStatus } from "@comp/csound/types";
import { CsoundObj } from "@csound/browser";
import { isNil, path, pathOr, propOr } from "ramda";
import * as projectActions from "../projects/actions";
import * as projectEditorActions from "../project-editor/actions";
import { filenameToCsoundType } from "@comp/csound/utils";
import * as SS from "./styles";
import "./modes/csound/csound";
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

type IPrintToConsole = ((text: string) => void) | undefined;

const cursorState = {};

let updateReduxDocumentValue;

// const updateGuestDocumentValue = debounce(
//     100,
//     (csound, projectUid, document, newValue) =>
//         projectActions.saveFileOffline(csound, projectUid, document, newValue)
// );

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
            cursorState[
                `${documentUid}:cursor_pos`
            ] = editorReference.getCursor();
            cursorState[
                `${documentUid}:history`
            ] = editorReference.getHistory();
        }
        updateReduxDocumentValue && updateReduxDocumentValue.cancel();
    }, [dispatch, projectUid, documentUid, editorReference, onChangedCallback]);

    useEffect(() => {
        return () => {
            textfieldReference && isMounted && onUnmount();
        };
    }, [textfieldReference, isMounted, onUnmount]);

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

    const csound: CsoundObj | undefined = useSelector(
        path(["csound", "csound"])
    );

    const csoundStatus: ICsoundStatus = useSelector(
        pathOr("stopped", ["csound", "status"])
    ) as ICsoundStatus;

    const printToConsole: IPrintToConsole | undefined = useSelector(
        path(["ConsoleReducer", "printToConsole"])
    );

    const findOrcBlock = () => {
        const value = editorReference
            ? (editorReference as any)?.doc?.getValue()
            : "";
        const lines = value.split("\n");
        const cursorLine = editorReference
            ? propOr(0, "line", editorReference.getCursor())
            : 0;

        const currentLineEndOfBound = uncommentLine(lines[cursorLine]).match(
            /endin|endop/g
        );

        const cursorBoundry = Math.min(
            cursorLine +
                (currentLineEndOfBound && currentLineEndOfBound.length > 0
                    ? 0
                    : 1),
            lines.length
        );

        let lastBlockLine, lineNumber;

        for (lineNumber = 0; lineNumber < cursorBoundry; lineNumber++) {
            const line = uncommentLine(lines[lineNumber]);
            if (/instr|opcode/g.test(line)) {
                lastBlockLine = lineNumber;
            } else if (/endin|endop/g.test(line)) {
                lastBlockLine = undefined;
            }
        }

        if (isNil(lastBlockLine)) {
            return {
                from: { line: cursorLine, ch: 0 },
                to: { line: cursorLine, ch: lines[cursorLine].length },
                evalStr: lines[cursorLine]
            };
        }

        let blockEnd;

        for (
            lineNumber = cursorLine;
            lineNumber < lines.length + 1;
            lineNumber++
        ) {
            if (blockEnd) {
                break;
            }
            const line = uncommentLine(lines[lineNumber]);

            if (/endin|endop/g.test(line)) {
                blockEnd = lineNumber;
            }
        }
        return !blockEnd
            ? {
                  from: { line: cursorLine, ch: 0 },
                  to: { line: cursorLine, ch: lines[cursorLine - 1].length },
                  evalStr: lines[cursorLine]
              }
            : {
                  from: { line: lastBlockLine, ch: 0 },
                  to: { line: blockEnd, ch: lines[blockEnd].length },
                  evalStr: lines.slice(lastBlockLine, blockEnd + 1).join("\n")
              };
    };

    const toggleComment = useCallback(() => {
        editorReference && editorReference.toggleComment();
    }, [editorReference]);

    const editorEvalCurried = editorEvalCode(
        csound,
        csoundStatus,
        documentType,
        printToConsole,
        findOrcBlock,
        editorReference
    );

    useEffect(() => {
        if (!isMounted && textfieldReference && textfieldReference.current) {
            const editor = CodeMirror.fromTextArea(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                textfieldReference.current!,
                {
                    autoCloseBrackets: true,
                    autoSuggest: true,
                    fullScreen: true,
                    height: "auto",
                    lineNumbers: true,
                    lineWrapping: true,
                    matchBrackets: true,
                    viewportMargin: Number.POSITIVE_INFINITY,
                    scrollbarStyle: "simple",
                    mode: ["csd", "orc", "sco", "udo"].some(
                        (t) => t === documentType
                    )
                        ? { name: "csound", documentType }
                        : "text/plain",
                    extraKeys: {
                        // noop default keybindings and handle from react
                        // all defaults: code-mirror/src/input/keymap.js
                        // "Ctrl-F": () => {},
                        // "Cmd-F": () => {},
                        // "Ctrl-Z": () => {},
                        // "Cmd-Z": () => {},
                        // "Shift-Ctrl-Z": () => {},
                        // "Ctrl-Y": () => {},
                        // "Shift-Cmd-Z": () => {},
                        // "Cmd-Y": () => {},
                        // todo: move to hot-keys
                        "Ctrl-E": () => editorEvalCurried(false),
                        "Ctrl-Enter": () => editorEvalCurried(true),
                        "Cmd-E": () => editorEvalCurried(false),
                        "Cmd-Enter": () => editorEvalCurried(true),
                        "Ctrl-;": () => toggleComment(),
                        "Cmd-;": () => toggleComment()
                    }
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
            editor.setCursor({ line: lastLine, ch: lastColumn });
            // editorDidMount(editor);
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
        }
    }, [
        dispatch,
        documentUid,
        projectUid,
        isMounted,
        setIsMounted,
        documentType,
        // editorDidMount,
        toggleComment,
        editorEvalCurried
    ]);

    // const editorWillUnmount = () => {
    //     if (editorReference) {
    //         cursorState[
    //             `${documentUid}:cursor_pos`
    //         ] = editorReference.getCursor();
    //         cursorState[
    //             `${documentUid}:history`
    //         ] = editorReference.getHistory();
    //     }
    //     dispatch(
    //         projectEditorActions.storeEditorInstance(
    //             undefined,
    //             projectUid,
    //             documentUid
    //         )
    //     );
    // };

    // const onChange = useCallback(
    //     (editor, data, value) => {
    //         // if editorRef doesn't exist = not yet
    //         // mounted (meaning the value wont fit savedValue)
    //         if (editorReference) {
    //             updateReduxDocumentValue(
    //                 value,
    //                 projectUid,
    //                 documentUid,
    //                 dispatch
    //             );
    //         }
    //     },
    //     [editorReference, projectUid, documentUid, dispatch]
    // );
    // const onGuestChange = useCallback(
    //     (editor, data, value) => {
    //         if (editorReference && csound) {
    //             updateGuestDocumentValue(csound, projectUid, document, value);
    //         }
    //     },
    //     [editorReference, projectUid, document, csound]
    // );

    return (
        <form style={{ overflowY: "hidden", height: "100%" }}>
            <textarea
                ref={textfieldReference}
                css={SS.root}
                style={{ fontSize: `16px !important` }}
                defaultValue={currentDocumentValue}
            ></textarea>
        </form>
    );
};

export default CodeEditor;
