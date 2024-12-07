import React, { useCallback, useEffect, useRef } from "react";
import { useConsole } from "./context";
import * as SS from "./styles";

const Console = (): React.ReactElement => {
    const logs = useConsole();
    const consoleReference = useRef<HTMLDivElement | null>(null);

    const onMessage = useCallback(() => {
        if (consoleReference && consoleReference.current) {
            const {
                clientHeight = 0,
                scrollHeight = 0,
                scrollTop = 0
            } = consoleReference.current;
            if (scrollTop + clientHeight < scrollHeight) {
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
