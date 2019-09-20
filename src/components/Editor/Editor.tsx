import React from "react";
import { connect } from "react-redux";
import { Controlled as CodeMirror } from "react-codemirror2";
import { IStore } from "../../db/interfaces";
import { ICsoundObj, ICsoundStatus } from "../Csound/types";
import PerfectScrollbar from "react-perfect-scrollbar";
import { isEmpty } from "lodash";
import * as projectActions from "../Projects/actions";
import * as projectEditorActions from "../ProjectEditor/actions";
import synopsis from "csound-manual-react/lib/manual/synopsis";
import "./modes/csound/csound"; // "./modes/csound/csound.js";
import { filenameToType } from "../Projects/utils";
require("codemirror/addon/comment/comment");
require("codemirror/addon/edit/matchbrackets");
require("codemirror/addon/edit/closebrackets");
require("codemirror/keymap/vim");
require("codemirror/keymap/emacs");
require("codemirror/lib/codemirror.css");
// require("codemirror/addon/scroll/simplescrollbars")
// require("codemirror/addon/scroll/simplescrollbars.css")

const opcodes = Object.keys(synopsis);

interface ICodeEditorProps {
    csound: ICsoundObj;
    csoundStatus: ICsoundStatus;
    currentDocumentValue: string;
    documentUid: string;
    documentType: string;
    isModifiedLocally: boolean;
    projectUid: string;
    printToConsole: (text: string) => void;
    savedValue: string;
    storeEditorInstance: (
        editor: any,
        projectUid: string,
        documentUid: string
    ) => void;
    updateDocumentValue: any;
    updateDocumentModifiedLocally: any;
    lookupManualString: any;
    manualLookupString: string | null;
}

// interface ICodeEditorLocalState {
//     currentEditorValue: string;
// }

class CodeEditor extends React.Component<ICodeEditorProps, {}> {
    protected editor: any;
    protected scroller: any;

    constructor(props: ICodeEditorProps) {
        super(props);
        this.editorDidMount = this.editorDidMount.bind(this);
        this.docAtPoint = this.docAtPoint.bind(this);
    }

    uncommentLine(line: string) {
        let uncommentedLine: any = line.split(";");
        if (uncommentedLine.length > 1) {
            uncommentedLine = uncommentedLine[0];
        } else {
            uncommentedLine = uncommentedLine[0].split("//");
            uncommentedLine = uncommentedLine[0];
        }
        return uncommentedLine;
    }

    findOrcBlock() {
        const editor = this.editor;
        const val = editor.doc.getValue();
        const lines = val.split("\n");
        const cursorLine = editor.getCursor().line;
        const currentLineEndOfBound: boolean = this.uncommentLine(
            lines[cursorLine]
        ).match(/endin|endop/g);

        const cursorBoundry = Math.min(
            cursorLine + (currentLineEndOfBound ? 0 : 1),
            lines.length
        );
        let lastBlockLine, lineNumber;

        for (lineNumber = 0; lineNumber < cursorBoundry; lineNumber++) {
            const line = this.uncommentLine(lines[lineNumber]);
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
            const line = this.uncommentLine(lines[lineNumber]);

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
                from: { line: lastBlockLine - 1, ch: 0 },
                to: { line: blockEnd, ch: lines[blockEnd].length },
                evalStr: lines.slice(lastBlockLine, blockEnd + 1).join("\n")
            };
        }
    }

    evalCode(blockEval: boolean) {
        const editor = this.editor;

        const { csound, csoundStatus, documentType } = this.props;

        if (csoundStatus !== "playing") {
            this.props.printToConsole("Csound isn't running!");
        } else {
            // selection takes precedence
            const selection = editor.getSelection();
            const cursor = editor.getCursor();
            let evalStr = "";
            // let csdLoc: "orc" | "sco" | null = null;

            if (!blockEval) {
                const line = editor.getLine(cursor.line);
                const textMarker = editor.markText(
                    { line: cursor.line, ch: 0 },
                    { line: cursor.line, ch: line.length },
                    { className: "blinkEval" }
                );
                setTimeout(() => textMarker.clear(), 300);
                evalStr = isEmpty(selection) ? line : selection;
            } else {
                let result;
                if (documentType === "orc" || documentType === "udo") {
                    result = this.findOrcBlock();
                } else if (documentType === "sco") {
                    // FIXME
                    result = {
                        from: { line: cursor.line, ch: 0 },
                        to: {
                            line: cursor.line,
                            ch: editor.getLine(cursor.line).length
                        },
                        evalStr: editor.getLine(cursor.line)
                    };
                }
                if (!!result) {
                    const textMarker = editor.markText(result.from, result.to, {
                        className: "blinkEval"
                    });
                    setTimeout(() => textMarker.clear(), 300);
                    evalStr = result!.evalStr;
                }
            }
            if (isEmpty(evalStr)) return;
            if (documentType === "orc" || documentType === "udo") {
                csound.evaluateCode(evalStr);
            } else if (documentType === "sco") {
                csound.readScore(evalStr);
            } else if (documentType === "csd") {
                csound.evaluateCode(evalStr);
            } else {
                this.props.printToConsole(
                    "Can't evaluate non-csound documents!"
                );
            }
        }
    }

    docAtPoint() {
        const editor = this.editor;
        const cursor = editor.getCursor();
        const token = editor.getTokenAt(cursor).string.replace(/:.*/, "");

        const { manualLookupString } = this.props;

        if (opcodes.some(opc => opc === token)) {
            const manualId = synopsis[token]["id"];
            if (manualLookupString === manualId) {
                // a way to retrigger the iframe communication
                this.props.lookupManualString(null);
                setTimeout(() => this.props.lookupManualString(manualId), 10);
            } else {
                this.props.lookupManualString(manualId);
            }
        }
    }

    toggleComment() {
        // let editor = this.cm.current.getCodeMirror();
        // editor.toggleComment();
    }

    editorDidMount(editor: any) {
        const {
            storeEditorInstance,
            updateDocumentValue,
            projectUid,
            documentUid,
            isModifiedLocally
        } = this.props;

        if (!isModifiedLocally) {
            updateDocumentValue(this.props.savedValue, projectUid, documentUid);
        }
        this.editor = editor;
        storeEditorInstance(editor, projectUid, documentUid);
        editor.focus();
        const lastCursorPos = localStorage.getItem(documentUid + ":cursorPos");
        if (!isEmpty(lastCursorPos)) {
            const storedScrollPos = JSON.parse(lastCursorPos || "");
            editor.setCursor(storedScrollPos);
            editor.scrollIntoView(storedScrollPos);
        } else {
            editor.setCursor({ line: 1, ch: 1 });
        }
    }

    public componentWillUnmount(this) {
        const { projectUid, documentUid, storeEditorInstance } = this.props;
        if (this.editor) {
            localStorage.setItem(
                documentUid + ":cursorPos",
                JSON.stringify(this.editor.getCursor())
            );
        }
        if (this.scroller) {
            localStorage.setItem(
                documentUid + ":scrollPos",
                this.scroller.scrollTop
            );
        }
        storeEditorInstance(null, projectUid, documentUid);
    }

    render() {
        const {
            updateDocumentValue,
            updateDocumentModifiedLocally,
            documentUid,
            projectUid,
            savedValue,
            documentType
        } = this.props;

        let options = {
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
            // scrollbarStyle: "simple",
            theme: "monokai",
            extraKeys: {
                "Ctrl-E": () => this.evalCode(false), // line eval
                "Ctrl-Enter": () => this.evalCode(true), // block eval
                "Cmd-E": () => this.evalCode(false), // line eval
                "Cmd-Enter": () => this.evalCode(true), // block eval
                "Ctrl-.": () => this.docAtPoint(),
                // "Ctrl-H": insertHexplay,
                // "Ctrl-J": insertEuclidplay,
                "Ctrl-;": () => this.toggleComment(),
                "Cmd-;": () => this.toggleComment()
            }
        };

        const onBeforeChange = (editor, data, value) => {
            updateDocumentValue(value, projectUid, documentUid);
            updateDocumentModifiedLocally(savedValue !== value, documentUid);
        };

        return (
            <PerfectScrollbar
                style={{ backgroundColor: "#272822" }}
                containerRef={ref => {
                    ref !== null &&
                        setTimeout(
                            () =>
                                ref.scrollTo(
                                    0,
                                    Number(
                                        localStorage.getItem(
                                            documentUid + ":scrollPos"
                                        )
                                    )
                                ),
                            1
                        );
                    this.scroller = ref;
                }}
            >
                <CodeMirror
                    editorDidMount={this.editorDidMount}
                    value={this.props.currentDocumentValue}
                    onBeforeChange={onBeforeChange}
                    options={options}
                />
            </PerfectScrollbar>
        );
    }
}

const mapStateToProps = (store: IStore, ownProp: any) => {
    const project = store.projects.activeProject;
    const document = project!.documents[ownProp.documentUid];
    const savedValue = document && document.savedValue;
    const currentDocumentValue = document && document.currentValue;
    const documentType = document && filenameToType(document.filename);
    const manualLookupString = store.ProjectEditorReducer.manualLookupString;

    return {
        csound: store.csound.csound,
        csoundStatus: store.csound.status,
        documentUid: ownProp.documentUid,
        currentDocumentValue,
        documentType,
        isModifiedLocally: document!.isModifiedLocally,
        printToConsole: store.ConsoleReducer.printToConsole,
        projectUid: ownProp.projectUid,
        savedValue,
        manualLookupString
    };
};

const mapDispatchToProps = (dispatch: any): any => ({
    updateDocumentValue: (
        val: string,
        projectUid: string,
        documentUid: string
    ) =>
        dispatch(
            projectActions.updateDocumentValue(val, projectUid, documentUid)
        ),
    storeEditorInstance: (
        editorInstance: any,
        projectUid: string,
        documentUid: string
    ) =>
        dispatch(
            projectEditorActions.storeEditorInstance(
                editorInstance,
                projectUid,
                documentUid
            )
        ),
    updateDocumentModifiedLocally: (isModified: boolean, documentUid: string) =>
        dispatch(
            projectActions.updateDocumentModifiedLocally(
                isModified,
                documentUid
            )
        ),
    lookupManualString: (manualLookupString: string | null) =>
        dispatch(projectEditorActions.lookupManualString(manualLookupString))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CodeEditor);
