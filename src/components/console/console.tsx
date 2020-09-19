import React, { useEffect, useRef } from "react";
import { isMobile } from "@root/utils";
import { useConsole } from "./context";
import { List } from "react-virtualized";
import { withResizeDetector } from "react-resize-detector";
import * as SS from "./styles";
import "react-virtualized/styles.css";

type IConsoleProperties = {
    height: number;
    width: number;
};

let scrollPosition = 0;

const Console = ({
    height = isMobile() ? 1000 : 250,
    width = 1200
}: IConsoleProperties) => {
    const logs = useConsole();
    const consoleReference: any = useRef();

    const onMessage = () => {
        if (consoleReference && consoleReference.current) {
            const row = consoleReference.current;
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
        if (consoleReference && consoleReference.current) {
            const row = consoleReference.current;
            row.scrollToRow(row.props.rowCount);
        }
    }, [consoleReference]);

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
                ref={consoleReference}
                autoHeight={false}
                height={height}
                width={width}
                css={SS.listWrapper}
                rowCount={((logs || []) as string[]).length + 2}
                rowHeight={16}
                overscanRowCount={2}
                rowRenderer={rowRenderer}
                scrollToAlignment={"end"}
                onRowsRendered={(renderEvent: any) => {
                    scrollPosition = renderEvent.overscanStopIndex;
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
