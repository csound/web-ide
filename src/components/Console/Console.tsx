import React, { useEffect, useRef } from "react";
import { useConsole } from "./context";
import { List } from "react-virtualized";
import { withResizeDetector } from "react-resize-detector";
import * as SS from "./styles";
import "react-virtualized/styles.css";

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

let scrollPosition = 0;

const Console = ({ height = 250, width = 1200 }: IConsoleProps) => {
    const logs = useConsole();
    const consoleRef: any = useRef(null);

    const onMessage = () => {
        if (consoleRef && consoleRef.current) {
            const row = consoleRef.current;
            const passtInitialHeight =
                row.props.height * 1.1 <
                row.props.rowHeight * row.props.rowCount;
            if (
                !passtInitialHeight ||
                row.props.rowCount - scrollPosition < 3
            ) {
                setTimeout(() => row.scrollToRow(row.props.rowCount), 9);
            }
        }
    };

    useEffect(() => {
        if (logs.length > 0) {
            onMessage();
        }
    });

    useEffect(() => {
        if (consoleRef && consoleRef.current) {
            const row = consoleRef.current;
            row.scrollToRow(row.props.rowCount);
        }
    }, [consoleRef]);

    function rowRenderer({ key, index, style }) {
        return (
            <li key={key} style={style}>
                <pre>{logs && logs[index]}</pre>
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
                rowCount={((logs || []) as string[]).length + 2}
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
