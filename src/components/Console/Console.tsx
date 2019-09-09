import React from "react";
import { ICsoundObj } from "../Csound/types";
import { setClearConsoleCallback, setPrintToConsoleCallback } from "./actions";
import { connect } from "react-redux";
import { IStore } from "../../db/interfaces";
import PerfectScrollbar from "react-perfect-scrollbar";
// import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
// import List from "react-virtualized/dist/commonjs/List";

interface IConsoleProps {
    csound: ICsoundObj | null;
}

interface IConsoleDispatchProps {
    setClearConsoleCallback: (callback: () => void) => void;
    setPrintToConsoleCallback: (callback: (text: string) => void) => void;
}

interface IConsoleLocalState {
    logs: string;
}

class Console extends React.Component<
    IConsoleProps & IConsoleDispatchProps,
    IConsoleLocalState
> {
    public readonly state: IConsoleLocalState = {
        logs: ""
    };

    protected consoleRef: any;
    protected scrollbarRef: any;

    constructor(props) {
        super(props);
        this.messageCallback = this.messageCallback.bind(this);
        this.consoleRef = React.createRef();
        this.scrollbarRef = React.createRef();
    }

    public messageCallback(msg: string) {
        const message = msg + "\n";
        this.setState({ logs: this.state.logs + message });
        setTimeout(
            () =>
                this.scrollbarRef &&
                this.scrollbarRef._container &&
                (this.scrollbarRef.current._container.scrollTop = this.scrollbarRef.current._container.scrollHeight),
            10
        );
    }

    public componentDidMount() {
        this.props.setClearConsoleCallback(() => {
            this.setState({ logs: "" });
        });
        this.props.setPrintToConsoleCallback((text: string) => {
            this.setState({ logs: this.state.logs + text + "\n" });
        });

        const initProjectInterval = setInterval(() => {
            if (this.props.csound) {
                clearInterval(initProjectInterval);
                this.props.csound.setMessageCallback(this.messageCallback);
            }
        }, 50);
    }

    public render() {
        return (
            <div className="console-log-container">
                <PerfectScrollbar ref={this.scrollbarRef}>
                    <pre id="console-log" ref={this.consoleRef}>
                        {this.state.logs}
                    </pre>
                </PerfectScrollbar>
            </div>
        );
    }
}

const mapStateToProps = (store: IStore, ownProp: any) => {
    return {
        csound: store.csound.csound
    };
};

const mapDispatchToProps = (dispatch: any): any => ({
    setClearConsoleCallback: (callback: () => void) =>
        dispatch(setClearConsoleCallback(callback)),
    setPrintToConsoleCallback: (callback: (text: string) => void) =>
        dispatch(setPrintToConsoleCallback(callback))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Console);
