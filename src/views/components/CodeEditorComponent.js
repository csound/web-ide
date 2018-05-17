import React from "react";
import CodeMirror from "react-codemirror";
require("../../mode/csound/csound.js");
require("codemirror/addon/comment/comment.js");
require("codemirror/addon/edit/matchbrackets.js");
require("codemirror/addon/edit/closebrackets.js");
require("codemirror/keymap/vim.js");
require("codemirror/keymap/emacs.js");

require("codemirror/lib/codemirror.css");
require("codemirror/theme/monokai.css");


class CodeEditorComponent extends React.Component {
    constructor(props) {
        super(props);
        this.cm = React.createRef();
    }

    evalCode() { 
        let editor = this.cm.current.getCodeMirror(); 
        console.log("Eval code: " + editor.getSelection());
        // TODO - hook this into global CsoundObj instance?
    }

    toggleComment() { 
        let editor = this.cm.current.getCodeMirror(); 
        console.log(editor);
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
                "Ctrl-;": () => this.toggleComment(),
            },
        };
        return <CodeMirror value={this.props.code} options={options} 
                           ref={this.cm} />;
    }
}

export default CodeEditorComponent;
