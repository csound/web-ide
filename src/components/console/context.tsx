import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CsoundObj } from "@csound/browser";
import { IProject } from "@comp/projects/types";
import { setClearConsoleCallback, setPrintToConsoleCallback } from "./actions";
import { append, path } from "ramda";

type IGlobalMessageCallback = (message: string) => void;

type IConsoleContextProperties = string[];

export const ConsoleContext = createContext([] as IConsoleContextProperties);

export const ConsoleProvider = ({
    children,
    activeProject,
    csound
}: {
    children: React.ReactElement;
    activeProject: IProject;
    csound: CsoundObj;
}): React.ReactElement => {
    const dispatch = useDispatch();
    const [logs, setLogs]: [string[], any] = useState([""]);
    const [currentProject, setCurrentProject] = useState();

    const messageCallback = (message: string) => {
        setLogs(append(message + "\n"));
    };

    const globalMessageCallback:
        | IGlobalMessageCallback
        | undefined = useSelector(path(["ConsoleReducer", "printToConsole"]));

    useEffect(() => {
        setClearConsoleCallback(() => {
            setLogs([]);
        });
    }, [setLogs]);

    useEffect(() => {
        if (
            csound &&
            (!currentProject ||
                (typeof currentProject === "object" &&
                    (currentProject as any).projectUid !==
                        activeProject.projectUid))
        ) {
            dispatch(setPrintToConsoleCallback(messageCallback));
            csound && csound.setMessageCallback(messageCallback);
            setLogs([""]);
            setCurrentProject(activeProject);
        }
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

export const useConsole = (): React.ReactContext | undefined => {
    const context = useContext(ConsoleContext);
    if (context === undefined) {
        throw new Error("useConsole must be used within a ConsoleProvider");
    }
    return context;
};

export default useConsole;
