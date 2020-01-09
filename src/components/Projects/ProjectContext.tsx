import React, { useEffect, useState } from "react";
import { useTheme } from "emotion-theming";
import { useSelector, useDispatch } from "react-redux";
import ProjectEditor from "@comp/ProjectEditor/ProjectEditor";
import { getDefaultTargetDocument } from "@comp/TargetControls/utils";
import { IDocumentsMap, IProject } from "@comp/Projects/types";
import Header from "@comp/Header/Header";
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
    const { className } = props;
    const activeProjectUid = useSelector(
        pathOr("", ["ProjectsReducer", "activeProjectUid"])
    );

    const project: IProject = useSelector(
        pathOr({} as IProject, [
            "ProjectsReducer",
            "projects",
            activeProjectUid
        ])
    );

    const defaultTarget = useSelector(store =>
        getDefaultTargetDocument(store, projectUid)
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
                        projectUid,
                        defaultTarget,
                        values(
                            propOr({}, "documents", project) as IDocumentsMap
                        )
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
                <ForceBackgroundColor theme={theme} />
                <Header />
                <ProjectEditor
                    {...props}
                    css={SS.main}
                    style={{ display: "none!important" }}
                    className={className}
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
