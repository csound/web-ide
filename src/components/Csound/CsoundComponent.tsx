import React from "react";
import CsoundObj from "./CsoundObj";
import { ICsoundObj } from "./interfaces";
import { isEmpty } from "lodash";

export const CsoundContext = React.createContext({} as any);

interface ICsoundComponent {
    children: JSX.Element[] | JSX.Element
}

interface ICsoundComponentLocalState {
    csound: ICsoundObj;
}


export default class CsoundComponent extends React.Component<ICsoundComponent, ICsoundComponentLocalState> {

    public readonly state: ICsoundComponentLocalState = {
        csound: null,
    }

    public componentDidMount() {
        CsoundObj.importScripts("./csound/").then(() => {
            const csoundObj = new CsoundObj();
            this.setState({ csound:  csoundObj });
        });
    }

    public render() {
        if (!this.state.csound || isEmpty(this.state.csound)) {
            return (
                <h5>Loading...</h5>
            )
        } else {
            return (
                <CsoundContext.Provider value={{csound: this.state.csound}}>
                    {this.props.children}
                </CsoundContext.Provider>
            )
        }

    }
}
