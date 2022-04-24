import React, { useEffect, useState } from "react";
import { Path } from "history";
import { Audio as AudioSpinner } from "react-loader-spinner";
import { useParams } from "react-router-dom";
import { push } from "connected-react-router/esm/index.js";
import { useTheme } from "@emotion/react";
// import { IStore } from "@store/types";
import { useSelector, useDispatch } from "react-redux";
import ProjectEditor from "@comp/project-editor/project-editor";
import { IProject } from "@comp/projects/types";
import Header from "@comp/header/header";
import { activateProject, downloadProjectOnce } from "./actions";
import * as SS from "./styles";
import { isEmpty, path, pathOr } from "ramda";

interface IProjectContextProperties {
    match: any;
}

const ForceBackgroundColor = ({ theme }): React.ReactElement => (
    <style>{`body {background-color: ${theme.background}}`}</style>
);

const ProjectContext = (
    properties: IProjectContextProperties
): React.ReactElement => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const routeParams: { id?: string } = useParams();

    const [projectFetchStarted, setProjectFetchStarted] = useState(false);
    const [projectIsReady, setProjectIsReady] = useState(false);
    const [needsLoading, setNeedsLoading] = useState(true);
    const projectUid = routeParams.id ? routeParams.id : "";
    const invalidUrl = !projectUid || isEmpty(projectUid);
    // this is true when /editor path is missing projectUid
    invalidUrl &&
        dispatch(
            push({ pathname: "/404" } as Path, { message: "Project not found" })
        );

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

    const tabIndex: number = useSelector(
        pathOr(-1, ["ProjectEditorReducer", "tabDock", "tabIndex"])
    );

    useEffect(() => {
        if (!projectFetchStarted) {
            const initProject = async () => {
                try {
                    await downloadProjectOnce(projectUid)(dispatch);
                } catch (error: any) {
                    if (
                        typeof error === "object" &&
                        typeof error.code === "string"
                    ) {
                        error.code === "permission-denied" &&
                            dispatch(
                                push({ pathname: "/404" } as Path, {
                                    message: "Project not found"
                                })
                            );
                    }
                }
                await activateProject(projectUid)(dispatch);
                setProjectIsReady(true);
            };
            setProjectFetchStarted(true);
            initProject();
        }

        if (needsLoading && projectFetchStarted && projectIsReady) {
            setNeedsLoading(false);
        }
    }, [
        dispatch,
        project,
        projectUid,
        activeProjectUid,
        needsLoading,
        projectIsReady,
        projectFetchStarted,
        tabIndex
    ]);

    return !needsLoading && !invalidUrl && project ? (
        <>
            <ForceBackgroundColor theme={theme} />
            <ProjectEditor {...properties} activeProject={project} />
            <Header />
        </>
    ) : (
        <>
            <ForceBackgroundColor theme={theme} />
            <Header />
            <main css={SS.loadMain}>
                <AudioSpinner
                    color={theme.highlightBackground}
                    height={80}
                    width={80}
                />
            </main>
        </>
    );
};

export default ProjectContext;
