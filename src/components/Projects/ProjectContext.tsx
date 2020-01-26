import React, { useEffect, useState } from "react";
import { useTheme } from "emotion-theming";
import { useSelector, useDispatch } from "react-redux";
import ProjectEditor from "@comp/ProjectEditor/ProjectEditor";
import { IProject } from "@comp/Projects/types";
import { ICsoundObj } from "@comp/Csound/types";
import Header from "@comp/Header/Header";
import { activateProject, downloadProjectOnce } from "./actions";
import * as SS from "./styles";
import { path, pathOr } from "ramda";

interface IProjectContextProps {
    match: any;
}

const ForceBackgroundColor = ({ theme }) => (
    <style>{`body {background-color: ${theme.background.primary}}`}</style>
);

export const ProjectContext = (props: IProjectContextProps) => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const [projectFetchStarted, setProjectFetchStarted] = useState(false);
    const [projectIsReady, setProjectIsReady] = useState(false);
    const [needsLoading, setNeedsLoading] = useState(true);
    const projectUid = props.match.params.id;

    const activeProjectUid: string | null = useSelector(
        store =>
            (path(["ProjectsReducer", "activeProjectUid"], store) as string) ||
            null
    );

    const project: IProject | null = useSelector(store =>
        activeProjectUid
            ? (path(
                  ["ProjectsReducer", "projects", activeProjectUid],
                  store
              ) as IProject) || null
            : null
    );

    const csound: ICsoundObj | null = useSelector(
        pathOr(null, ["csound", "csound"])
    );

    const tabIndex: number = useSelector(
        pathOr(-1, ["ProjectEditorReducer", "tabDock", "tabIndex"])
    );

    useEffect(() => {
        if (!projectFetchStarted && csound) {
            const initProject = async () => {
                await downloadProjectOnce(projectUid)(dispatch);
                await activateProject(projectUid)(dispatch);
                setProjectIsReady(true);
            };
            setProjectFetchStarted(true);
            initProject();
        }
        if (needsLoading && projectFetchStarted && projectIsReady && csound) {
            setNeedsLoading(false);
        }
        // eslint-disable-next-line
    }, [
        csound,
        project,
        activeProjectUid,
        needsLoading,
        projectIsReady,
        projectFetchStarted,
        tabIndex
    ]);

    if (!needsLoading) {
        return (
            <>
                <ForceBackgroundColor theme={theme} />
                <Header />
                <ProjectEditor
                    {...props}
                    csound={csound as unknown}
                    activeProject={project}
                />
            </>
        );
    } else {
        return (
            <>
                <ForceBackgroundColor theme={theme} />
                <Header />
                <main css={SS.loadMain}>
                    <div css={SS.loadingSpinner1}>
                        <div css={SS.loadingSpinner2}>
                            <div css={SS.loadingSpinner3}></div>
                        </div>
                    </div>
                </main>
            </>
        );
    }
};

export default ProjectContext;
