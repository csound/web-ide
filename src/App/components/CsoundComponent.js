import React from "react";
import CsoundObj from "CsoundObj";
export const CsoundContext = React.createContext();

export default class CsoundComponent extends React.Component {
    constructor(props) {
        super(props);

        // instantiate Csound;
        this.state = { csound: null };
        CsoundObj.importScripts("https://waaw.csound.com/js/").then(() => {
            this.setState({ csound: new CsoundObj() });
        });
    }
    render() {
        return (
            <CsoundContext.Provider value={this.state.csound}>
                {this.props.children}
            </CsoundContext.Provider>
        );
    }
}
