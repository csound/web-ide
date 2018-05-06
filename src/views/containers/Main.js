import React from "react";
import CodeMirror from "react-codemirror"
import { connect } from "react-redux";
import { Card, CardHeader, CardBody, Row, Col } from "reactstrap";
import { getAll } from "../../selectors/FirebaseSelectors";

// this didn't quite work...
//import * as csmode from '../../mode/csound/csound.js';

require('codemirror/addon/comment/comment.js');
require('codemirror/addon/edit/matchbrackets.js');
require('codemirror/addon/edit/closebrackets.js');
require('codemirror/keymap/vim.js');
require('codemirror/keymap/emacs.js');


require('codemirror/lib/codemirror.css');
require('codemirror/theme/monokai.css');

class Main extends React.Component {

    constructor() {
        super()
        this.state = { code: ";; Csound code"}
    }

    render() {
        let options = { 
            lineNumbers: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            theme: 'monokai',
            mode: 'csound',
        }
        return (
            <CodeMirror value={this.state.code}  options={options}/>
        );
    }
}

const mapStateToProps = store => {
    return { allData: getAll(store) };
};

export default connect(mapStateToProps, null)(Main);
