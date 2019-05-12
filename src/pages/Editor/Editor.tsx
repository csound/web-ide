import React, { Component } from "react";
import { connect } from "react-redux";
import { IStore } from "../../db/interfaces";
import CodeEditor from "./components/CodeEditor";
import { CsoundContext } from "../../App/components/CsoundComponent";

interface IEditorProps {
    currentCollection: string;
    currentProject: string;
    currentDocumentName: string;
}

class Editor extends Component<IEditorProps, any> {

    render() {
        return (
            <CsoundContext.Consumer>
                {val => <CodeEditor csound={val} />}
            </CsoundContext.Consumer>
        );
    }
}

const mapStateToProps = (store: IStore, ownProp: any) => {
    return {}
}

export default connect(mapStateToProps, {})(Editor);
