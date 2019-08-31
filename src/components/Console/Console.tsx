import React from "react";
import { ICsoundObj } from "../Csound/types";
import { connect } from "react-redux";
import { IStore } from "../../db/interfaces";
import PerfectScrollbar from "react-perfect-scrollbar";
// import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
// import List from "react-virtualized/dist/commonjs/List";

interface IConsoleProps {
    csound: ICsoundObj | null;
}

interface IConsoleLocalState {
    logs: string;
}

class Console extends React.Component<IConsoleProps, IConsoleLocalState> {

    public readonly state: IConsoleLocalState = {
        logs: "",
    }

    constructor(props: IConsoleProps) {
        super(props);
        this.messageCallback = this.messageCallback.bind(this);
    }

    public messageCallback(msg: string) {
        this.setState({logs: this.state.logs + msg});
    }

    public componentDidMount() {

        const initProjectInterval = setInterval(() => {
            if (this.props.csound) {
                clearInterval(initProjectInterval);
                this.props.csound.setMessageCallback(this.messageCallback);
                this.props.csound.start();
            }
        }, 50);
    }

    public render() {
        return(

            <div className="console-log-container draggable">
                <PerfectScrollbar>
                    <pre>
                        {this.state.logs}
                    </pre>
                </PerfectScrollbar>
            </div>

        )
    }
}

const mapStateToProps = (store: IStore, ownProp: any) => {
    return {
        csound: store.csound.csound,
    }
}

export default connect(mapStateToProps, {})(Console);
