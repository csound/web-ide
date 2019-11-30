import React from "react";
import { ICsoundObj } from "../Csound/types";
import { setClearConsoleCallback, setPrintToConsoleCallback } from "./actions";
import { connect } from "react-redux";
import { IStore } from "../../db/interfaces";
import { List } from "react-virtualized";
import Measure from "react-measure";
import { append, merge, pathOr } from "ramda";
import PerfectScrollbar from "perfect-scrollbar";
import * as SS from "./styles";
import "react-virtualized/styles.css";

type ContentRect = {
    entry?: {
        width: number;
        height: number;
    };
};

interface IConsoleProps {
    csound: ICsoundObj | null;
}

interface IConsoleDispatchProps {
    setClearConsoleCallback: (callback: () => void) => void;
    setPrintToConsoleCallback: (callback: (text: string) => void) => void;
}

interface IConsoleLocalState {
    logs: React.ReactNode[];
    lineCnt: number;
    logWindowWidth: number;
    logWindowHeight: number;
}

class Console extends React.Component<
    IConsoleProps & IConsoleDispatchProps,
    IConsoleLocalState
> {
    public readonly state: IConsoleLocalState = {
        logs: [],
        lineCnt: 0,
        logWindowWidth: 300,
        logWindowHeight: 300
    };

    protected consoleRef: any;
    protected _isMounted: boolean = false;

    constructor(props) {
        super(props);
        this.messageCallback = this.messageCallback.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.rowRenderer = this.rowRenderer.bind(this);
        this.consoleRef = React.createRef();
    }

    public messageCallback(msg: string) {
        if (this._isMounted === false) {
            return;
        }
        this.setState({
            logs: append(msg, this.state.logs),
            lineCnt: this.state.lineCnt + 1
        });

        // auto scroll to end when new line is added
        this.consoleRef &&
            this.consoleRef.current &&
            this.consoleRef.current.scrollToPosition(
                this.consoleRef.current.props.rowHeight * this.state.lineCnt
            );
    }

    protected onWindowResize(contentRect: ContentRect) {
        this.setState(
            merge(this.state, {
                logWindowWidth: pathOr(
                    this.state.logWindowWidth,
                    ["entry", "width"],
                    contentRect
                ),
                logWindowHeight: pathOr(
                    this.state.logWindowHeight,
                    ["entry", "height"],
                    contentRect
                )
            })
        );
    }

    protected rowRenderer({ key, index, style }) {
        return (
            <li key={key} style={style}>
                {this.state.logs[index]}
            </li>
        );
    }

    public componentDidMount() {
        this._isMounted = true;
        this.props.setClearConsoleCallback(() => {
            this.setState({ logs: [] });
        });
        this.props.setPrintToConsoleCallback(this.messageCallback);
        new PerfectScrollbar("#csound-console");
        const initProjectInterval = setInterval(() => {
            if (this.props.csound) {
                clearInterval(initProjectInterval);
                this.props.csound.setMessageCallback(this.messageCallback);
            }
        }, 50);
    }
    public componentWillUnmount() {
        this._isMounted = false;
    }

    public render() {
        return (
            <Measure onResize={this.onWindowResize}>
                {({ measureRef }) => (
                    <div className="console-log-container" ref={measureRef}>
                        <List
                            id="csound-console"
                            ref={this.consoleRef}
                            autoHeight={false}
                            css={SS.listElem}
                            rowCount={this.state.lineCnt}
                            width={this.state.logWindowWidth}
                            height={this.state.logWindowHeight}
                            rowHeight={16}
                            rowRenderer={this.rowRenderer}
                            scrollToAlignment={"end"}
                        ></List>
                    </div>
                )}
            </Measure>
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
