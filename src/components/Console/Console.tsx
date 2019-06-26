import React from "react";
import { ICsoundObj } from "../Csound/interfaces";
import { connect } from "react-redux";
import { IStore } from "../../db/interfaces";
// import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
// import List from "react-virtualized/dist/commonjs/List";

interface IConsoleProps {
    csound: ICsoundObj;
}

interface IConsoleLocalState {
    logBuffer: string;
    logs: string[];
}

class Console extends React.Component<IConsoleProps, IConsoleLocalState> {

    constructor(props: IConsoleProps) {
        super(props);
        this.messageCallback = this.messageCallback.bind(this);
    }

    public messageCallback(msg: string) {
        console.log("MSG", msg);

    }

    public componentDidMount() {
        const {csound} = this.props;
        console.log(csound);
        // csound.setMessageCallback(this.messageCallback);
    }

    public render() {
        return(
            <h1>Prufa</h1>
        )
    }
}

const mapStateToProps = (store: IStore, ownProp: any) => {
    return {
        csound: ownProp.csound,
    }
}

export default connect(mapStateToProps, {})(Console);
