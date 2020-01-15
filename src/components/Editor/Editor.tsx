import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { UnControlled as CodeMirror } from "react-codemirror2";
import { editorEvalCode, useDebounce } from "./utils";
import { IDocument, IProject } from "../Projects/types";
import { ICsoundObj, ICsoundStatus } from "../Csound/types";
import PerfectScrollbar from "react-perfect-scrollbar";
import { isEmpty } from "lodash";
import { pathOr, propOr } from "ramda";
import * as projectActions from "../Projects/actions";
import * as projectEditorActions from "../ProjectEditor/actions";
import synopsis from "csound-manual-react/lib/manual/synopsis";
import "./modes/csound/csound"; // "./modes/csound/csound.js";
import { filenameToCsoundType } from "@comp/Csound/utils";
import { perfectScrollbarStyleSheet } from "@styles/_perfectScrollbar";
import * as SS from "./styles";
import { keys } from "ramda";
require("codemirror/addon/comment/comment");
require("codemirror/addon/edit/matchbrackets");
require("codemirror/addon/edit/closebrackets");
require("codemirror/keymap/vim");
require("codemirror/keymap/emacs");
require("codemirror/lib/codemirror.css");
// require("codemirror/addon/scroll/simplescrollbars")
// require("codemirror/addon/scroll/simplescrollbars.css")

const opcodes = keys(synopsis);

type IPrintToConsole = ((text: string) => void) | null;

const CodeEditor = ({ documentUid, projectUid }) => {
    const [editorRef, setEditorRef] = useState(null as any);
    const [scrollerRef, setScrollerRef] = useState(null as any);
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

    const savedValue: string = propOr("", "savedValue", document);
    const currentDocumentValue: string = propOr("", "currentValue", document);
    const maybeCsoundFile = filenameToCsoundType(document.filename);
    const documentType: string = maybeCsoundFile ? maybeCsoundFile : "txt";

    const manualLookupString: string = useSelector(
        pathOr("", ["ProjectEditorReducer", "manualLookupString"])
    );

    const csound: ICsoundObj | null = useSelector(
        pathOr(null, ["csound", "csound"])
    ) as ICsoundObj | null;

    const csoundStatus: ICsoundStatus = useSelector(
        pathOr("stopped", ["csound", "status"])
    ) as ICsoundStatus;

    const printToConsole: IPrintToConsole = useSelector(
        pathOr(null, ["ConsoleReducer", "printToConsole"])
    ) as IPrintToConsole;

    const lookupManualString = dispatch => (
        manualLookupString: string | null
    ) => dispatch(projectEditorActions.lookupManualString(manualLookupString));

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
        const cursorLine = editorRef ? editorRef.getCursor().line : 0;
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

        if (!lastBlockLine) {
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

    const docAtPoint = () => {
        if (!editorRef) return;
        const cursor = editorRef.getCursor();
        const token = editorRef.getTokenAt(cursor).string.replace(/:.*/, "");

        if (opcodes.some(opc => opc === token)) {
            const manualId = synopsis[token]["id"];
            if (manualLookupString === manualId) {
                // a way to retrigger the iframe communication
                lookupManualString(null);
                setTimeout(() => lookupManualString(manualId), 10);
            } else {
                lookupManualString(manualId);
            }
        }
    };

    const toggleComment = () => {
        editorRef && editorRef.toggleComment();
    };

    const editorDidMount = (editor: any) => {
        editor.getDoc().setValue(currentDocumentValue);
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
        const lastCursorPos = localStorage.getItem(documentUid + ":cursorPos");
        if (!isEmpty(lastCursorPos)) {
            const storedScrollPos = JSON.parse(lastCursorPos || "");
            editor.setCursor(storedScrollPos);
            editor.scrollIntoView(storedScrollPos);
        } else {
            editor.setCursor({ line: 1, ch: 1 });
        }
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
            localStorage.setItem(
                documentUid + ":cursorPos",
                JSON.stringify(editorRef.getCursor())
            );
        }
        if (scrollerRef) {
            localStorage.setItem(
                documentUid + ":scrollPos",
                (scrollerRef as any).scrollTop
            );
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
        // autoFocus: true,
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
            "Ctrl-.": () => docAtPoint(),
            // "Ctrl-H": insertHexplay,
            // "Ctrl-J": insertEuclidplay,
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
        <PerfectScrollbar
            css={perfectScrollbarStyleSheet}
            containerRef={setScrollerRef}
        >
            <CodeMirror
                css={SS.root}
                editorDidMount={editorDidMount}
                editorWillUnmount={editorWillUnmount}
                options={options}
                onChange={onChange}
            />
        </PerfectScrollbar>
    );
};

export default CodeEditor;
