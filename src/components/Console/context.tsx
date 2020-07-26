import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setClearConsoleCallback, setPrintToConsoleCallback } from "./actions";
import { append, pathOr } from "ramda";

type IGlobalMsgCallback = (msg: string) => void;

type IConsoleContextProps = string[];

export const ConsoleContext = createContext([] as IConsoleContextProps);

export const ConsoleProvider = ({ children, activeProject, csound }) => {
    const dispatch = useDispatch();
    const [logs, setLogs]: [string[], any] = useState([""]);
    const [currentProject, setCurrentProject] = useState();

    const messageCallback = (msg: string) => {
        setLogs(append(msg + "\n"));
    };

    const globalMessageCallback: IGlobalMsgCallback | null = useSelector(
        pathOr(null, ["ConsoleReducer", "printToConsole"])
    );

    useEffect(() => {
        setClearConsoleCallback(() => {
            setLogs([]);
        });
    }, [setLogs]);

    useEffect(() => {
        if (csound) {
            if (!currentProject || currentProject !== activeProject) {
                dispatch(setPrintToConsoleCallback(messageCallback));
                csound && csound.setMessageCallback(messageCallback);
                setLogs([""]);
                setCurrentProject(activeProject);
            }
        }
        return () => {
            dispatch(setPrintToConsoleCallback(null));
        };
    }, [
        activeProject,
        currentProject,
        csound,
        dispatch,
        globalMessageCallback
    ]);

    return (
        <ConsoleContext.Provider value={logs}>
            {children}
        </ConsoleContext.Provider>
    );
};

export const useConsole = () => {
    const context = useContext(ConsoleContext);
    if (context === undefined) {
        throw new Error("useConsole must be used within a ConsoleProvider");
    }
    return context;
};

export default useConsole;
