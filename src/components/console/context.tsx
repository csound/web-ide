import React, { createContext, useContext, useEffect, useState } from "react";
import { setClearConsoleCallback } from "./actions";

type IConsoleContextProperties = string[];
type SetConsole = React.Dispatch<React.SetStateAction<string[]>>;

export const ConsoleContext = createContext([] as IConsoleContextProperties);

export const ConsoleWriteContext = createContext<SetConsole | undefined>(
    undefined
);

export const ConsoleProvider = ({
    children
}: {
    children: React.ReactElement | React.ReactNode;
}) => {
    const [logs, setLogs] = useState<string[]>([""]);

    useEffect(() => {
        setClearConsoleCallback(() => {
            setLogs([""]);
        });
    }, [setLogs]);

    return (
        <ConsoleWriteContext.Provider value={setLogs}>
            <ConsoleContext.Provider value={logs}>
                {children}
            </ConsoleContext.Provider>
        </ConsoleWriteContext.Provider>
    );
};

export const useConsole = (): string[] => {
    const context = useContext(ConsoleContext);
    if (context === undefined) {
        throw new Error("useConsole must be used within a ConsoleProvider");
    }
    return context;
};

export const useSetConsole = (): SetConsole => {
    const context = useContext(ConsoleWriteContext);
    if (context === undefined) {
        throw new Error(
            "useSetConsole must be used within a ConsoleWriteContext"
        );
    }
    return context;
};
