import React from "react";
import { connect } from "react-redux";
import {UnControlled as CodeMirror} from "react-codemirror2";
import { IStore } from "../../db/interfaces";
import "./modes/csound/csound"; // "./modes/csound/csound.js";
require("codemirror/addon/comment/comment");
require("codemirror/addon/edit/matchbrackets");
require("codemirror/addon/edit/closebrackets");
require("codemirror/keymap/vim");
require("codemirror/keymap/emacs");
require("codemirror/lib/codemirror.css");
require("codemirror/theme/monokai.css");


interface ICodeEditorProps {
        csound: any;
    }

interface ICodeEditorLocalState {
    currentEditorValue: string;
}

class CodeEditor extends React.Component<ICodeEditorProps, ICodeEditorLocalState> {

    protected cm: any;

    public readonly state: ICodeEditorLocalState = {
        currentEditorValue: "HVAREREG",
    }

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

    componentDidMount() {
        // console.log(this.cm.current);
        // const CodeMirror = this.cm.current.getCodeMirror();
        // CodeMirror.setSize("100%", "100%");
    }

    render() {
        let options = {
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
        return (
            <CodeMirror
                value={this.state.currentEditorValue}
                options={options}
                ref={this.cm}
            />
        );
    }
}

const mapStateToProps = (store: IStore, ownProp: any) => {
    return {
        csound: ownProp.csound,
    }
}

export default connect(mapStateToProps, {})(CodeEditor);
