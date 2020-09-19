import React, { useEffect, useState } from "react";
import LoaderSpinner from "react-loader-spinner";
import { push } from "connected-react-router";
import { useTheme } from "emotion-theming";
import { ITheme } from "@styles/types";
import { useSelector, useDispatch } from "react-redux";
import { ConsoleProvider } from "@comp/console/context";
import ProjectEditor from "@comp/project-editor/project-editor";
import { IProject } from "@comp/projects/types";
import { ICsoundObject } from "@comp/csound/types";
import Header from "@comp/header/header";
import { activateProject, downloadProjectOnce } from "./actions";
import * as SS from "./styles";
import { isEmpty, path, pathOr } from "ramda";

interface IProjectContextProps {
    match: any;
}

const ForceBackgroundColor = ({ theme }) => (
    <style>{`body {background-color: ${theme.background}}`}</style>
);

export default (properties: IProjectContextProps) => {
    const dispatch = useDispatch();
    const theme: ITheme = useTheme();
    const [projectFetchStarted, setProjectFetchStarted] = useState(false);
    const [projectIsReady, setProjectIsReady] = useState(false);
    const [needsLoading, setNeedsLoading] = useState(true);
    const projectUid = properties.match.params.id;
    const invalidUrl = !projectUid || isEmpty(projectUid);
    // this is true when /editor path is missing projectUid
    invalidUrl && dispatch(push("/404", { message: "Project not found" }));

    const activeProjectUid: string | undefined = useSelector(
        (store) =>
            !invalidUrl && path(["ProjectsReducer", "activeProjectUid"], store)
    );

    const project: IProject | undefined = useSelector(
        (store) =>
            activeProjectUid &&
            !invalidUrl &&
            path(["ProjectsReducer", "projects", activeProjectUid], store)
    );

    const csound: ICsoundObject | undefined = useSelector(
        path(["csound", "csound"])
    );

    const tabIndex: number = useSelector(
        pathOr(-1, ["ProjectEditorReducer", "tabDock", "tabIndex"])
    );

    useEffect(() => {
        if (!projectFetchStarted && csound) {
            const initProject = async () => {
                try {
                    await downloadProjectOnce(projectUid)(dispatch);
                } catch (error) {
                    if (
                        typeof error === "object" &&
                        typeof error.code === "string"
                    ) {
                        error.code === "permission-denied" &&
                            dispatch(
                                push("/404", { message: "Project not found" })
                            );
                    }
                }
                await activateProject(projectUid, csound)(dispatch);
                setProjectIsReady(true);
            };
            setProjectFetchStarted(true);
            initProject();
        }
        if (needsLoading && projectFetchStarted && projectIsReady && csound) {
            setNeedsLoading(false);
        }
    }, [
        dispatch,
        csound,
        project,
        projectUid,
        activeProjectUid,
        needsLoading,
        projectIsReady,
        projectFetchStarted,
        tabIndex
    ]);

    if (!needsLoading && !invalidUrl && project) {
        return (
            <>
                <ForceBackgroundColor theme={theme} />
                <Header />
                <ConsoleProvider activeProject={project} csound={csound}>
                    <ProjectEditor
                        {...properties}
                        csound={csound as unknown}
                        activeProject={project}
                    />
                </ConsoleProvider>
            </>
        );
    } else {
        return (
            <>
                <ForceBackgroundColor theme={theme} />
                <Header />
                <main css={SS.loadMain}>
                    <LoaderSpinner
                        type="Audio"
                        color={theme.highlightBackground}
                        height={80}
                        width={80}
                    />
                </main>
            </>
        );
    }
};
