import React, { useCallback, useEffect, useRef } from "react";
import { useConsole } from "./context";
import * as SS from "./styles";

const Console = ({ height = 200 }: { height?: number }): React.ReactElement => {
    const logs = useConsole();
    const consoleReference: any = useRef();

    const onMessage = useCallback(() => {
        if (consoleReference && consoleReference.current) {
            const {
                clientHeight = 0,
                scrollHeight = 0,
                scrollTop = 0
            } = consoleReference.current;
            if (clientHeight >= scrollHeight) {
                consoleReference.current.scrollTop = scrollHeight;
            } else if (
                scrollHeight - scrollTop < clientHeight ||
                scrollTop < clientHeight * 2
            ) {
                consoleReference.current.scrollTop = scrollHeight;
            }
        }
    }, [consoleReference]);

    useEffect(() => {
        onMessage();
    }, [logs, onMessage]);

    return (
        <div css={SS.ConsoleContainer} ref={consoleReference}>
            <code>{((logs || []) as string[]).join("")}</code>
        </div>
    );
};

export default Console;
