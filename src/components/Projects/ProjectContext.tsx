import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import ProjectEditor from "../ProjectEditor/ProjectEditor";
import { IProject } from "../Projects/types";
import Header from "../Header/Header";
import {
    activateProject,
    loadProjectFromFirestore,
    openProjectDocumentTabs,
    syncProjectDocumentsWithEMFS
} from "./actions";
import * as SS from "./styles";
import { has, pathOr, propOr, values } from "ramda";

interface IProjectContextProps {
    className: string;
    // main: JSX.Element[] | JSX.Element;
    match: any;
}

export const ProjectContext = (props: IProjectContextProps) => {
    const dispatch = useDispatch();
    const [projectFetchStarted, setProjectFetchStarted] = useState(false);
    const [projectIsReady, setProjectIsReady] = useState(false);
    const [needsLoading, setNeedsLoading] = useState(true);
    const projectUid = props.match.params.id;
    const { className } = props;
    const activeProjectUid = useSelector(
        pathOr(null, ["ProjectsReducer", "activeProjectUid"])
    );

    const project: IProject = useSelector(
        pathOr({} as IProject, [
            "ProjectsReducer",
            "projects",
            activeProjectUid
        ])
    );

    const csound = useSelector(pathOr(null, ["csound", "csound"]));

    useEffect(() => {
        if (!projectFetchStarted && csound) {
            const initProject = async () => {
                setProjectFetchStarted(true);
                // type bug '(dispatch: any) => Promise<void>'
                await dispatch(loadProjectFromFirestore(projectUid));
                await dispatch(activateProject(projectUid));
                setProjectIsReady(true);
            };
            initProject();
        }
        if (
            needsLoading &&
            projectFetchStarted &&
            projectIsReady &&
            csound &&
            has("documents", project)
        ) {
            const initUI = async () => {
                await dispatch(
                    openProjectDocumentTabs(
                        values(propOr({}, "documents", project))
                    )
                );
                await dispatch(syncProjectDocumentsWithEMFS(projectUid));
                setNeedsLoading(false);
            };
            initUI();
        }
        // eslint-disable-next-line
    }, [
        csound,
        project,
        activeProjectUid,
        needsLoading,
        projectIsReady,
        projectFetchStarted
    ]);

    if (!needsLoading) {
        return (
            <>
                <Header />
                <ProjectEditor
                    {...props}
                    css={SS.main}
                    className={className}
                    activeProject={project}
                />
            </>
        );
    } else {
        return (
            <main css={SS.loadMain}>
                <div css={SS.loadingSpinner1}>
                    <div css={SS.loadingSpinner2}>
                        <div css={SS.loadingSpinner3}></div>
                    </div>
                </div>
            </main>
        );
    }
};

export default ProjectContext;
