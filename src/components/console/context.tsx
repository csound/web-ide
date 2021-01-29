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
    activeProject
}: {
    children: React.ReactElement;
    activeProject: IProject;
}): React.ReactElement => {
    const dispatch = useDispatch();
    const [logs, setLogs]: [string[], any] = useState([""]);
    const [currentProject, setCurrentProject]: [
        IProject | undefined,
        (proj: IProject) => void
    ] = useState();

    const messageCallback = (message: string) => {
        setLogs(append(message + "\n"));
    };

    const csoundInstance: CsoundObj | undefined = useSelector(
        path(["csound", "csound"])
    );

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
            csoundInstance &&
            (!currentProject ||
                (typeof currentProject === "object" &&
                    (currentProject as any).projectUid !==
                        activeProject.projectUid))
        ) {
            dispatch(setPrintToConsoleCallback(messageCallback));
            csoundInstance && csoundInstance.on("message", messageCallback);
            setLogs([""]);
            setCurrentProject(activeProject);
        }
    }, [
        activeProject,
        currentProject,
        csoundInstance,
        dispatch,
        globalMessageCallback
    ]);

    return (
        <ConsoleContext.Provider value={logs}>
            {children}
        </ConsoleContext.Provider>
    );
};

export const useConsole = (): string[] | undefined => {
    const context = useContext(ConsoleContext);
    if (context === undefined) {
        throw new Error("useConsole must be used within a ConsoleProvider");
    }
    return context;
};

export default useConsole;
