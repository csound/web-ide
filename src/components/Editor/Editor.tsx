import React from "react";
import { connect } from "react-redux";
import { Controlled as CodeMirror } from "react-codemirror2";
import { IStore } from "../../db/interfaces";
import { ICsoundObj, ICsoundStatus } from "../Csound/types";
import PerfectScrollbar from "react-perfect-scrollbar";
import { isEmpty } from "lodash";
import * as projectActions from "../Projects/actions";
import * as projectEditorActions from "../ProjectEditor/actions";
import "./modes/csound/csound"; // "./modes/csound/csound.js";
require("codemirror/addon/comment/comment");
require("codemirror/addon/edit/matchbrackets");
require("codemirror/addon/edit/closebrackets");
require("codemirror/keymap/vim");
require("codemirror/keymap/emacs");
require("codemirror/lib/codemirror.css");
require("codemirror/theme/monokai.css");
// require("codemirror/addon/scroll/simplescrollbars")
// require("codemirror/addon/scroll/simplescrollbars.css")

interface ICodeEditorProps {
    csound: ICsoundObj;
    csoundStatus: ICsoundStatus;
    currentDocumentValue: string;
    documentUid: string;
    documentType: string;
    projectUid: string;
    printToConsole: (text: string) => void;
    savedValue: string;
    updateDocumentValue: any;
    updateDocumentModifiedLocally: any;
}

// interface ICodeEditorLocalState {
//     currentEditorValue: string;
// }

class CodeEditor extends React.Component<ICodeEditorProps, {}> {
    protected cm: any;

    constructor(props: ICodeEditorProps) {
        super(props);
        this.cm = React.createRef();
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
        const editor = this.cm.current.editor;
        const val = editor.doc.getValue();
        const lines = val.split("\n");
        const cursorLine = editor.getCursor().line;
        const cursurBoundry = Math.min(cursorLine + 1, lines.length + 1);
        let lastBlockLine, lineNumber;

        for (lineNumber = 1; lineNumber < cursurBoundry; lineNumber++) {
            const line = this.uncommentLine(lines[lineNumber - 1]);
            if (line.match(/instr|opcode/g)) {
                lastBlockLine = lineNumber;
            } else if (line.match(/endin|endop/g)) {
                lastBlockLine = null;
            }
        }

        if (!lastBlockLine) {
            return {
                from: { line: cursorLine, ch: 0 },
                to: { line: cursorLine, ch: lines[cursorLine - 1].length },
                evalStr: lines[cursorLine - 1]
            };
        }

        let blockEnd;

        for (
            lineNumber = Math.max(cursorLine - 1, 1);
            lineNumber < lines.length + 1;
            lineNumber++
        ) {
            if (!!blockEnd) break;
            const line = this.uncommentLine(lines[lineNumber - 1]);

            if (line.match(/endin|endop/g)) {
                blockEnd = lineNumber;
            }
        }

        if (!blockEnd) {
            return {
                from: { line: cursorLine, ch: 0 },
                to: { line: cursorLine, ch: lines[cursorLine - 1].length },
                evalStr: lines[cursorLine - 1]
            };
        } else {
            return {
                from: { line: lastBlockLine - 1, ch: 0 },
                to: { line: blockEnd, ch: lines[blockEnd - 1].length },
                evalStr: lines.slice(lastBlockLine - 1, blockEnd).join("\n")
            };
        }
    }

    evalCode(blockEval: boolean) {
        const editor = this.cm.current.editor;

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

    toggleComment() {
        // let editor = this.cm.current.getCodeMirror();
        // editor.toggleComment();
    }

    public componentDidMount(this) {
        const {
            updateDocumentValue,
            projectUid,
            documentUid,
            storeEditorInstance
        } = this.props;

        updateDocumentValue(this.props.savedValue, projectUid, documentUid);
        storeEditorInstance(this.cm.current.editor, projectUid, documentUid);
        setTimeout(
            () =>
                this.cm.current &&
                this.cm.current.editor &&
                this.cm.current.editor.focus(),
            100
        );
    }

    public componentWillUnmount(this) {
        const { projectUid, documentUid, storeEditorInstance } = this.props;
        storeEditorInstance(null, projectUid, documentUid);
    }

    render() {
        let options = {
            // autoFocus: true,
            autoCloseBrackets: true,
            fullScreen: true,
            lineNumbers: true,
            lineWrapping: true,
            matchBrackets: true,
            mode: "csound",
            // scrollbarStyle: "simple",
            theme: "monokai",
            extraKeys: {
                "Ctrl-E": () => this.evalCode(false), // line eval
                "Ctrl-Enter": () => this.evalCode(true), // block eval
                // "Ctrl-H": insertHexplay,
                // "Ctrl-J": insertEuclidplay,
                "Ctrl-;": () => this.toggleComment()
            }
        };

        const {
            updateDocumentValue,
            updateDocumentModifiedLocally,
            documentUid,
            projectUid,
            savedValue
        } = this.props;

        const onBeforeChange = (editor, data, value) => {
            updateDocumentValue(value, projectUid, documentUid);
            updateDocumentModifiedLocally(savedValue !== value, documentUid);
        };

        return (
            <PerfectScrollbar style={{ backgroundColor: "#272822" }}>
                <CodeMirror
                    value={this.props.currentDocumentValue}
                    onBeforeChange={onBeforeChange}
                    options={options}
                    ref={this.cm}
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
    const documentType = document && document.type;

    return {
        csound: store.csound.csound,
        csoundStatus: store.csound.status,
        documentUid: ownProp.documentUid,
        currentDocumentValue,
        documentType,
        printToConsole: store.ConsoleReducer.printToConsole,
        projectUid: ownProp.projectUid,
        savedValue
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
        )
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CodeEditor);
