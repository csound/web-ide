import React, { useCallback, useEffect, useState, useRef } from "react";
import { ICsoundObj } from "../Csound/types";
import {
    // setClearConsoleCallback,
    setPrintToConsoleCallback
} from "./actions";
import { useDispatch, useSelector } from "react-redux";
// import { IStore } from "@store/types";
import { List } from "react-virtualized";
import { withResizeDetector } from "react-resize-detector";
import { append, pathOr } from "ramda";
import * as SS from "./styles";
import "react-virtualized/styles.css";

type IGlobalMsgCallback = (msg: string) => void;

type ContentRect = {
    entry?: {
        width: number;
        height: number;
    };
};

type IConsoleProps = {
    width: number;
    height: number;
};

const Console = ({ width, height }: IConsoleProps) => {
    const dispatch = useDispatch();
    const consoleRef: any = useRef(null);

    const [logs, setLogs] = useState([]);

    const csound: ICsoundObj | null = useSelector(
        pathOr(null, ["csound", "csound"])
    ) as ICsoundObj | null;

    const globalMessageCallback: IGlobalMsgCallback | null = useSelector(
        pathOr(null, ["ConsoleReducer", "printToConsole"])
    );

    const messageCallback = useCallback(
        (logs, setLogs) => {
            return function msgCb(msg: string) {
                setLogs(append(msg));

                // auto scroll to end when new line is added
                // consoleRef &&
                //     consoleRef.current &&
                //     consoleRef.current.scrollToPosition(
                //         consoleRef.current.props.rowHeight * logs.length
                //     );
            };
        },
        // eslint-disable-next-line
        [logs, setLogs]
    );

    useEffect(() => {
        if (csound) {
            if (!globalMessageCallback) {
                dispatch(
                    setPrintToConsoleCallback(messageCallback(logs, setLogs))
                );
                csound &&
                    csound.setMessageCallback(messageCallback(logs, setLogs));
            }
        }
        return function() {
            globalMessageCallback && dispatch(setPrintToConsoleCallback(null));
        };
        // eslint-disable-next-line
    }, [csound, globalMessageCallback]);

    function rowRenderer({ key, index, style }) {
        return (
            <li key={key} style={style}>
                {logs[index]}
            </li>
        );
    }
    return (
        <List
            key={"ListWithResize"}
            ref={consoleRef}
            autoHeight={false}
            height={height || 400}
            width={width || 400}
            css={SS.listWrapper}
            rowCount={logs.length}
            rowHeight={16}
            rowRenderer={rowRenderer}
            scrollToAlignment={"end"}
        ></List>
    );
};

export default withResizeDetector(Console);
