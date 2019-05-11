import React from "react";
import CsoundObj from "./CsoundObj";

export const CsoundContext = React.createContext({ csound: null });

// const CsoundObj = (window as any).CsoundObj;

interface ICsoundComponent {
    children: JSX.Element[] | JSX.Element
}

interface ICsoundComponentLocalState {
    csound: any;
}


export default class CsoundComponent extends React.Component<ICsoundComponent, ICsoundComponentLocalState> {

    public readonly state: ICsoundComponentLocalState = {
        csound: null,
    }

    public componentDidMount() {
        CsoundObj.importScripts("https://waaw.csound.com/js/").then(() => {
            this.setState({ csound: new CsoundObj() });
        });
    }

    public render() {
        return (
            <CsoundContext.Provider value={this.state.csound}>
                {this.props.children}
            </CsoundContext.Provider>
        );
    }
}
