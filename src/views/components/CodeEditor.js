import React from "react";
import CodeMirror from "react-codemirror";

require("codemirror/addon/comment/comment.js");
require("codemirror/addon/edit/matchbrackets.js");
require("codemirror/addon/edit/closebrackets.js");
require("codemirror/keymap/vim.js");
require("codemirror/keymap/emacs.js");

require("codemirror/lib/codemirror.css");
require("codemirror/theme/monokai.css");

class CodeEditor extends React.Component {
    render() {
        let options = {
            lineNumbers: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            theme: "monokai",
            mode: "csound"
        };
        return <CodeMirror value={this.props.code} options={options} />;
    }
}

export default CodeEditor;
