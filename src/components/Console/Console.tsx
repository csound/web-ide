import React, { useEffect, useState, useRef } from "react";
import { ICsoundObj } from "../Csound/types";
import { setClearConsoleCallback, setPrintToConsoleCallback } from "./actions";
import { useDispatch, useSelector } from "react-redux";
// import { IStore } from "@store/types";
import { List } from "react-virtualized";
import { withResizeDetector } from "react-resize-detector";
import { append, dropLast, pathOr } from "ramda";
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

let scrollPosition = 0;

const Console = ({ width, height }: IConsoleProps) => {
    const dispatch = useDispatch();
    const consoleRef: any = useRef(null);

    const [logs, setLogs] = useState([""] as string[]);

    const csound: ICsoundObj | null = useSelector(
        pathOr(null, ["csound", "csound"])
    ) as ICsoundObj | null;

    const globalMessageCallback: IGlobalMsgCallback | null = useSelector(
        pathOr(null, ["ConsoleReducer", "printToConsole"])
    );

    useEffect(() => {
        dispatch(
            setClearConsoleCallback(() => {
                scrollPosition = 0;
                setLogs([""]);
            })
        );
        return () => {
            dispatch(setClearConsoleCallback(() => {}));
        };
    }, [dispatch, setLogs]);

    const messageCallback = (msg: string) => {
        if (consoleRef && consoleRef.current) {
            const row = consoleRef.current;
            setLogs(currentLogs => {
                const passtInitialHeight =
                    row.props.height * 1.1 <
                    row.props.rowHeight * row.props.rowCount;
                if (
                    !passtInitialHeight ||
                    row.props.rowCount - scrollPosition < 3
                ) {
                    setTimeout(() => row.scrollToRow(row.props.rowCount), 9);
                }
                return append("", append(dropLast(1, msg), currentLogs));
            });
        }
    };

    useEffect(() => {
        if (csound) {
            if (!globalMessageCallback) {
                dispatch(setPrintToConsoleCallback(messageCallback));
                csound && csound.setMessageCallback(messageCallback);
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
            style={{ paddingBottom: 12 }}
            css={SS.listWrapper}
            rowCount={logs.length}
            rowHeight={16}
            rowRenderer={rowRenderer}
            scrollToAlignment={"end"}
            onRowsRendered={(e: any) => {
                scrollPosition = e.overscanStopIndex;
            }}
        ></List>
    );
};

export default withResizeDetector(Console);
