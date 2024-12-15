import { useEffect, useState } from "react";
import { Audio as AudioSpinner } from "react-loader-spinner";
import { useParams } from "react-router-dom";
import { push } from "connected-react-router";
import { Theme, useTheme } from "@emotion/react";
// import { IStore } from "@store/types";
import { useSelector, useDispatch } from "react-redux";
import ProjectEditor from "@comp/project-editor/project-editor";
import { IProject } from "@comp/projects/types";
import { cleanupNonCloudFiles } from "@comp/file-tree/actions";
import { Header } from "@comp/header/header";
import { activateProject, downloadProjectOnce } from "./actions";
import { isEmpty, pathOr } from "ramda";
import { UnknownAction } from "redux";
import { RootState } from "@root/store";
import * as SS from "./styles";

interface IProjectContextProperties {
    match: any;
}

const ForceBackgroundColor = ({ theme }: { theme: Theme }) => (
    <style>{`body {background-color: ${theme.background}}`}</style>
);

export const ProjectContext = (properties: IProjectContextProperties) => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const routeParams: { id?: string } = useParams();

    const [projectFetchStarted, setProjectFetchStarted] = useState(false);
    const [projectIsReady, setProjectIsReady] = useState(false);
    const [needsLoading, setNeedsLoading] = useState(true);
    const projectUid = routeParams.id ?? "";
    const invalidUrl = !projectUid || isEmpty(projectUid);
    // this is true when /editor path is missing projectUid
    invalidUrl &&
        dispatch(
            push(
                { path: "/404" },
                {
                    message: "Project not found"
                }
            ) as unknown as UnknownAction
        );

    const activeProjectUid: string | undefined = useSelector(
        (store: RootState) =>
            !invalidUrl ? store?.ProjectsReducer?.activeProjectUid : undefined
    );

    const project: IProject | undefined = useSelector((store: RootState) =>
        activeProjectUid && !invalidUrl
            ? store?.ProjectsReducer?.projects?.[activeProjectUid]
            : undefined
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
                                push("/404", {
                                    message: "Project not found"
                                }) as unknown as UnknownAction
                            );
                    }
                }
                dispatch(
                    cleanupNonCloudFiles({
                        projectUid
                    }) as unknown as UnknownAction
                );
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

    return (
        <>
            <ForceBackgroundColor theme={theme} />
            {project && <ProjectEditor activeProject={project} />}
            <Header />
            {needsLoading && (
                <main css={SS.loadMain}>
                    <AudioSpinner
                        color={theme.highlightBackground}
                        height={80}
                        width={80}
                    />
                </main>
            )}
        </>
    );
};
