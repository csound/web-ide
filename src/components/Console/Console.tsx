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
        logs: ""
    };

    protected consoleRef: any;
    protected scrollbarRef: any;

    constructor(props: IConsoleProps) {
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
                (this.scrollbarRef.current._container.scrollTop = this.scrollbarRef.current._container.scrollHeight),
            10
        );
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

export default connect(
    mapStateToProps,
    {}
)(Console);
