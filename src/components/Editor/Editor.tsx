import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { UnControlled as CodeMirror } from "react-codemirror2";
import { editorEvalCode } from "./utils";
import { useDebounce } from "@root/utils";
import { IDocument, IProject } from "../Projects/types";
import { ICsoundObj, ICsoundStatus } from "../Csound/types";
import { isNil, pathOr, propOr } from "ramda";
import * as projectActions from "../Projects/actions";
import * as projectEditorActions from "../ProjectEditor/actions";
import { filenameToCsoundType } from "@comp/Csound/utils";
import * as SS from "./styles";
import "./modes/csound/csound";
import "./plugins/autosuggest";
require("codemirror/addon/comment/comment");
require("codemirror/addon/edit/matchbrackets");
require("codemirror/addon/edit/closebrackets");
require("codemirror/keymap/vim");
require("codemirror/keymap/emacs");
require("codemirror/lib/codemirror.css");

type IPrintToConsole = ((text: string) => void) | null;

const cursorState = {};

const CodeEditor = ({ documentUid, projectUid }) => {
    const [editorRef, setEditorRef] = useState(null as any);
    const [editorValue, setEditorValue] = useState("");
    const debouncedEditorValue = useDebounce(editorValue, 200);
    const dispatch = useDispatch();
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

    const lastModified = useSelector(
        pathOr(null, [
            "ProjectsReducer",
            "projects",
            activeProjectUid,
            "documents",
            documentUid,
            "lastModified"
        ])
    );

    const savedValue: string = propOr("", "savedValue", document);
    const currentDocumentValue: string = propOr("", "currentValue", document);
    const maybeCsoundFile = filenameToCsoundType(document.filename);
    const documentType: string = maybeCsoundFile ? maybeCsoundFile : "txt";

    const csound: ICsoundObj | null = useSelector(
        pathOr(null, ["csound", "csound"])
    ) as ICsoundObj | null;

    const csoundStatus: ICsoundStatus = useSelector(
        pathOr("stopped", ["csound", "status"])
    ) as ICsoundStatus;

    const printToConsole: IPrintToConsole = useSelector(
        pathOr(null, ["ConsoleReducer", "printToConsole"])
    ) as IPrintToConsole;

    const uncommentLine = (line: string) => {
        let uncommentedLine: any = line.split(";");
        if (uncommentedLine.length > 1) {
            uncommentedLine = uncommentedLine[0];
        } else {
            uncommentedLine = uncommentedLine[0].split("//");
            uncommentedLine = uncommentedLine[0];
        }
        return uncommentedLine;
    };

    const findOrcBlock = () => {
        const val = editorRef ? editorRef.doc.getValue() : "";
        const lines = val.split("\n");
        const cursorLine = editorRef
            ? propOr(0, "line", editorRef.getCursor())
            : 0;

        const currentLineEndOfBound: boolean = uncommentLine(
            lines[cursorLine]
        ).match(/endin|endop/g);

        const cursorBoundry = Math.min(
            cursorLine + (currentLineEndOfBound ? 0 : 1),
            lines.length
        );

        let lastBlockLine, lineNumber;

        for (lineNumber = 0; lineNumber < cursorBoundry; lineNumber++) {
            const line = uncommentLine(lines[lineNumber]);
            if (line.match(/instr|opcode/g)) {
                lastBlockLine = lineNumber;
            } else if (line.match(/endin|endop/g)) {
                lastBlockLine = null;
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
            if (!!blockEnd) break;
            const line = uncommentLine(lines[lineNumber]);

            if (line.match(/endin|endop/g)) {
                blockEnd = lineNumber;
            }
        }

        if (!blockEnd) {
            return {
                from: { line: cursorLine, ch: 0 },
                to: { line: cursorLine, ch: lines[cursorLine - 1].length },
                evalStr: lines[cursorLine]
            };
        } else {
            return {
                from: { line: lastBlockLine, ch: 0 },
                to: { line: blockEnd, ch: lines[blockEnd].length },
                evalStr: lines.slice(lastBlockLine, blockEnd + 1).join("\n")
            };
        }
    };

    const toggleComment = () => {
        editorRef && editorRef.toggleComment();
    };

    const editorDidMount = (editor: any) => {
        editor.scrollIntoView = () => {
            setTimeout(() => {
                if (
                    (window as any)[`editor_scroller`] &&
                    typeof (window as any)[`editor_scroller`].update ===
                        "function"
                ) {
                    (window as any)[`editor_scroller`].update();
                }
            }, 50);
        };
        editor.getDoc().setValue(currentDocumentValue);

        const editorHistory = pathOr(
            null,
            [`${documentUid}:history`],
            cursorState
        );
        if (editorHistory) {
            editor.getDoc().setHistory(editorHistory);
        } else {
            editor.getDoc().clearHistory();
        }
        setEditorValue(currentDocumentValue);

        setEditorRef(editor as any);
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
    };

    const editorEvalCurried = editorEvalCode(
        csound,
        csoundStatus,
        documentType,
        printToConsole,
        findOrcBlock,
        editorRef
    );

    const editorWillUnmount = () => {
        if (editorRef) {
            cursorState[`${documentUid}:cursor_pos`] = editorRef.getCursor();
            cursorState[`${documentUid}:history`] = editorRef.getHistory();
        }
        dispatch(
            projectEditorActions.storeEditorInstance(
                null,
                projectUid,
                documentUid
            )
        );
    };
    const options = {
        autoSuggest: true,
        autoCloseBrackets: true,
        fullScreen: true,
        lineNumbers: true,
        lineWrapping: true,
        matchBrackets: true,
        mode: ["csd", "orc", "sco", "udo"].some(t => t === documentType)
            ? "csound"
            : "text/plain",
        viewportMargin: Infinity,
        extraKeys: {
            "Ctrl-E": () => editorEvalCurried(false),
            "Ctrl-Enter": () => editorEvalCurried(true),
            "Cmd-E": () => editorEvalCurried(false),
            "Cmd-Enter": () => editorEvalCurried(true),
            "Ctrl-;": () => toggleComment(),
            "Cmd-;": () => toggleComment()
        }
    };

    useEffect(() => {
        // editorRef indicates that editor has initialized
        if (editorRef) {
            dispatch(
                projectActions.updateDocumentModifiedLocally(
                    editorValue !== savedValue,
                    projectUid,
                    documentUid
                )
            );
            dispatch(
                projectActions.updateDocumentValue(
                    debouncedEditorValue,
                    projectUid,
                    documentUid
                )
            );
        }
        // eslint-disable-next-line
    }, [dispatch, debouncedEditorValue]);

    // eslint-disable-next-line
    const onChange = (editor, data, value) => {
        // if editorRef doesn't exist = not yet
        // mounted (meaning the value wont fit savedValue)
        if (editorRef) {
            setEditorValue(value);
        }
    };

    return (
        <CodeMirror
            key={lastModified ? `${(lastModified as any).seconds}` : "_"}
            css={SS.root}
            editorDidMount={editorDidMount}
            editorWillUnmount={editorWillUnmount}
            options={options}
            onChange={onChange}
        />
    );
};

export default CodeEditor;
