import React, { useEffect, useState, useRef } from "react";
import { ICsoundObj } from "../Csound/types";
import { setClearConsoleCallback, setPrintToConsoleCallback } from "./actions";
import { useDispatch, useSelector } from "react-redux";
import { selectActiveProject } from "@comp/Projects/selectors";
// import { IStore } from "@store/types";
import { List } from "react-virtualized";
import { withResizeDetector } from "react-resize-detector";
import { append, pathOr } from "ramda";
import * as SS from "./styles";
import "react-virtualized/styles.css";
// import { Height } from "@material-ui/icons";

type IGlobalMsgCallback = (msg: string) => void;

type ContentRect = {
    entry?: {
        width: number;
        height: number;
    };
};

type IConsoleProps = {
    height: number;
    width: number;
};

type IinterimLogsStore = {
    projectUid: string | null;
    logs: string[];
};

let scrollPosition = 0;
let interimLogsStore: IinterimLogsStore = { projectUid: "", logs: [""] };

const Console = ({ height = 250, width = 400 }: IConsoleProps) => {
    const dispatch = useDispatch();
    const consoleRef: any = useRef(null);

    const [logs, setLogs] = useState([""] as string[]);

    const csound: ICsoundObj | null = useSelector(
        pathOr(null, ["csound", "csound"])
    ) as ICsoundObj | null;

    const globalMessageCallback: IGlobalMsgCallback | null = useSelector(
        pathOr(null, ["ConsoleReducer", "printToConsole"])
    );

    const activeProject = useSelector(selectActiveProject);

    const projectUid = activeProject && activeProject.projectUid;

    useEffect(() => {
        dispatch(
            setClearConsoleCallback(() => {
                // scrollPosition = 0;
                setLogs([]);
            })
        );

        return () => {
            dispatch(setClearConsoleCallback(() => {}));
        };
    }, [dispatch, setLogs]);

    useEffect(() => {
        if (interimLogsStore.projectUid === projectUid) {
            setLogs(interimLogsStore.logs);
        } else {
            interimLogsStore.projectUid = projectUid;
            interimLogsStore.logs = [""];
            // scrollPosition = 0;
        }
    }, [projectUid, setLogs]);

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
                const newLogState = append(msg + "\n", currentLogs);
                interimLogsStore.logs = newLogState;
                return newLogState;
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
                <pre>{logs[index]}</pre>
            </li>
        );
    }

    return (
        <div css={SS.virtualizedListContainer}>
            <List
                key={"ListWithResize"}
                ref={consoleRef}
                autoHeight={false}
                height={height}
                width={width}
                css={SS.listWrapper}
                rowCount={logs.length + 2}
                rowHeight={16}
                overscanRowCount={2}
                rowRenderer={rowRenderer}
                scrollToAlignment={"end"}
                onRowsRendered={(e: any) => {
                    scrollPosition = e.overscanStopIndex;
                }}
            ></List>
        </div>
    );
};

export default withResizeDetector(Console, {
    handleWidth: true,
    handleHeight: true,
    refreshMode: "debounce"
});
