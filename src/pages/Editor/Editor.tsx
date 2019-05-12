import React, { Component } from "react";
import { connect } from "react-redux";
import CodeEditor from "./components/CodeEditor";
import { CsoundContext } from "../../App/components/CsoundComponent";

interface IEditor {
    code: string;
}

class Editor extends Component<IEditor, any> {
    render() {
        return (
            <CsoundContext.Consumer>
                {val => <CodeEditor {...this.props} csound={val} />}
            </CsoundContext.Consumer>
        );
    }
}

export default connect(store => { return {}; }, {})(Editor);
