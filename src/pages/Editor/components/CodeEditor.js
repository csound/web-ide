import React from "react";
import CodeMirror from "react-codemirror";
require("./mode/csound/csound.js");
require("codemirror/addon/comment/comment");
require("codemirror/addon/edit/matchbrackets");
require("codemirror/addon/edit/closebrackets");
require("codemirror/keymap/vim");
require("codemirror/keymap/emacs");
require("codemirror/lib/codemirror.css");
require("codemirror/theme/monokai.css");

class CodeEditor extends React.Component {
    constructor(props) {
        super(props);
        this.cm = React.createRef();
    }

    evalCode() {
        let editor = this.cm.current.getCodeMirror();
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
        let editor = this.cm.current.getCodeMirror();
        editor.toggleComment();
    }

    render() {
        let options = {
            lineNumbers: true,
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
                value={this.props.code}
                options={options}
                ref={this.cm}
            />
        );
    }
}

export default CodeEditor;
