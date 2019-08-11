import React from "react";
import { connect } from "react-redux";
import {Controlled as CodeMirror} from "react-codemirror2";
import { IStore } from "../../db/interfaces";
import CsoundObj from "../Csound/CsoundObj";
import { ICsoundObj } from "../Csound/interfaces";
import SplitPane from "react-split-pane";
import Console from "../Console/Console";
import * as projectActions from "../Projects/actions";
import "./modes/csound/csound"; // "./modes/csound/csound.js";
require("codemirror/addon/comment/comment");
require("codemirror/addon/edit/matchbrackets");
require("codemirror/addon/edit/closebrackets");
require("codemirror/keymap/vim");
require("codemirror/keymap/emacs");
require("codemirror/lib/codemirror.css");
require("codemirror/theme/monokai.css");


interface ICodeEditorProps {
    csound: ICsoundObj;
    currentDocumentValue: string;
    documentIndex: number;
    projectIndex: number;
    savedValue: string;
    updateDocumentValue: any;
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


    public componentWillUpdate() {} // dummy component

    public componentDidMount(this) {
        const { updateDocumentValue, documentIndex, projectIndex } = this.props;
        updateDocumentValue(this.props.savedValue, projectIndex, documentIndex);
        // const hackInterval = setInterval(() => {
        //     this.cm.current.mirror.focus();
        //     this.cm.current.mirror.refresh();
        // })
        // setTimeout(() => {
        //     console.log("REFRESH!", this.cm.current);
        //     this.cm.current.ref.click();
        // }, 3000);
        CsoundObj.importScripts("./csound/").then(() => {
            // const csoundObj = new CsoundObj();
            // this.setState({ csound:  csoundObj });
        });
    }

    // componentDidMount() {
    //     // console.log("MOUNT!!");
    //     // const CodeMirror = this.cm.current.getCodeMirror();
    //     // CodeMirror.setSize("100%", "100%");
    // }

    render() {
        let options = {
            autoFocus: true,
            lineNumbers: true,
            lineWrapping: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            theme: "monokai",
            mode: "csound",
            extraKeys: {
                "Ctrl-E": () => this.evalCode(),
                // "Ctrl-H": insertHexplay,
                // "Ctrl-J": insertEuclidplay,
                "Ctrl-;": () => this.toggleComment()
            }
        };

        const { updateDocumentValue, documentIndex, projectIndex } = this.props;

        const onBeforeChange = (editor, data, value) => {
            updateDocumentValue(value, projectIndex, documentIndex);
        }


        return (
            <SplitPane split="horizontal" minSize="95%" defaultSize="80%">
                <CodeMirror
                    value={this.props.currentDocumentValue}
                    onBeforeChange={onBeforeChange}
                    options={options}
                    ref={this.cm}
                />
                <Console csound={this.props.csound} />
            </SplitPane>
        );
    }
}

const mapStateToProps = (store: IStore, ownProp: any) => {

    const currentDocumentValue = store.ProjectsReducer.projects[ownProp.projectIndex].documents[ownProp.documentIndex].currentValue;

    return {
        csound: null,
        currentDocumentValue,
        documentIndex: ownProp.documentIndex,
        projectIndex: ownProp.projectIndex,
        savedValue: ownProp.savedValue,
    }
}

const mapDispatchToProps = (dispatch: any): any => ({
    updateDocumentValue: (val: string, projectIndex: number, documentIndex: number) =>
        dispatch(projectActions.updateDocumentValue(val, projectIndex, documentIndex))
});

export default connect(mapStateToProps, mapDispatchToProps)(CodeEditor);
