import React from "react";
import { connect } from "react-redux";
import { Controlled as CodeMirror } from "react-codemirror2";
import { IStore } from "../../db/interfaces";
import { ICsoundObj } from "../Csound/types";
import PerfectScrollbar from "react-perfect-scrollbar";
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
    currentDocumentValue: string;
    documentUid: string;
    projectUid: string;
    savedValue: string;
    updateDocumentValue: any;
    updateDocumentModifiedLocally: any;
}

// interface ICodeEditorLocalState {
//     currentEditorValue: string;
// }

class CodeEditor extends React.Component<ICodeEditorProps, {}> {
    protected cm: any;

    // public readonly state: ICodeEditorLocalState = {
    //     currentEditorValue: "",
    // }

    constructor(props: ICodeEditorProps) {
        super(props);
        this.cm = React.createRef();
    }

    evalCode() {
        let editor = this.cm.current.editor;
        console.log("Eval code: " + editor.getSelection());
        // TODO - hook this into global CsoundObj instance?

        let cs = this.props.csound;

        if (cs != null) {
            cs.audioContext.resume();
            cs.compileOrc(
                "sr=48000\nksmps=128\n0dbfs=1\nnchnls=2\nnchnls_i=1\n"
            );
            cs.setOption("-odac");
            cs.setOption("-m0");
            cs.start();
            cs.compileOrc(editor.getSelection());
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
                "Ctrl-E": () => this.evalCode(),
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

    return {
        csound: null,
        documentUid: ownProp.documentUid,
        currentDocumentValue,
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
