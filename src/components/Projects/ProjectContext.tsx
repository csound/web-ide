import React, { useEffect, useState } from "react";
import LoaderSpinner from "react-loader-spinner";
import { push } from "connected-react-router";
import { useTheme } from "emotion-theming";
import { ITheme } from "@styles/types";
import { useSelector, useDispatch } from "react-redux";
import { ConsoleProvider } from "@comp/Console/context";
import ProjectEditor from "@comp/ProjectEditor/ProjectEditor";
import { IProject } from "@comp/Projects/types";
import { ICsoundObj } from "@comp/Csound/types";
import Header from "@comp/Header/Header";
import { activateProject, downloadProjectOnce } from "./actions";
import * as SS from "./styles";
import { isEmpty, path, pathOr } from "ramda";

interface IProjectContextProps {
    match: any;
}

const ForceBackgroundColor = ({ theme }) => (
    <style>{`body {background-color: ${theme.background}}`}</style>
);

export const ProjectContext = (props: IProjectContextProps) => {
    const dispatch = useDispatch();
    const theme: ITheme = useTheme();
    const [projectFetchStarted, setProjectFetchStarted] = useState(false);
    const [projectIsReady, setProjectIsReady] = useState(false);
    const [needsLoading, setNeedsLoading] = useState(true);
    const projectUid = props.match.params.id;
    const invalidUrl = !projectUid || isEmpty(projectUid);
    // this is true when /editor path is missing projectUid
    invalidUrl && dispatch(push("/404", { message: "Project not found" }));

    const activeProjectUid: string | null = useSelector(
        store =>
            (!invalidUrl &&
                (path(
                    ["ProjectsReducer", "activeProjectUid"],
                    store
                ) as string)) ||
            null
    );

    const project: IProject | null = useSelector(store =>
        activeProjectUid && !invalidUrl
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
                try {
                    await downloadProjectOnce(projectUid)(dispatch);
                } catch (e) {
                    if (typeof e === "object" && typeof e.code === "string") {
                        e.code === "permission-denied" &&
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

    if (!needsLoading && !invalidUrl && project) {
        return (
            <>
                <ForceBackgroundColor theme={theme} />
                <Header />
                <ConsoleProvider activeProject={project} csound={csound}>
                    <ProjectEditor
                        {...props}
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

export default ProjectContext;
