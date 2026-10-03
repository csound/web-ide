import React, { useCallback, useEffect, useRef } from "react";
import { useConsole } from "./context";
import * as SS from "./styles";
import ConsolePrompt from "./prompt";

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

    useEffect(() => {
        if (!consoleReference.current || typeof ResizeObserver === "undefined")
            return;
        const observer = new ResizeObserver(onMessage);
        observer.observe(consoleReference.current);
        return () => observer.disconnect();
    }, [onMessage]);

    return (
        <div css={SS.ConsoleContainer}>
            <div
                css={SS.consoleOutput}
                ref={consoleReference}
                data-testid="console-output-container"
            >
                <code data-testid="console-output">
                    {((logs || []) as string[]).join("")}
                </code>
            </div>
            <ConsolePrompt />
        </div>
    );
};

export default Console;
