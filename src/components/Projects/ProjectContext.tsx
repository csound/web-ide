import React, { useEffect, useState } from "react";
import { useTheme } from "emotion-theming";
import { useSelector, useDispatch } from "react-redux";
import ProjectEditor from "@comp/ProjectEditor/ProjectEditor";
import { getDefaultTargetDocument } from "@comp/TargetControls/utils";
import { IDocument, IDocumentsMap, IProject } from "@comp/Projects/types";
import { ICsoundObj } from "@comp/Csound/types";
import Header from "@comp/Header/Header";
import {
    activateProject,
    loadProjectFromFirestore,
    syncProjectDocumentsWithEMFS
} from "./actions";
import { tabDockInit } from "@comp/ProjectEditor/actions";
import * as SS from "./styles";
import { has, path, pathOr, values } from "ramda";

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

    const documentsMap: IDocumentsMap | null = useSelector(store =>
        activeProjectUid && project
            ? (path(
                  [
                      "ProjectsReducer",
                      "projects",
                      activeProjectUid,
                      "documents"
                  ],
                  store
              ) as IDocumentsMap) || null
            : null
    );

    const documents: IDocument[] | null = documentsMap
        ? values(documentsMap)
        : null;

    const defaultTarget: IDocument | null = useSelector(store =>
        project ? getDefaultTargetDocument(store, projectUid) : null
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
            has("documents", project) &&
            documents &&
            documents.length > 0
        ) {
            if (tabIndex < 0) {
                dispatch(tabDockInit(projectUid, documents, defaultTarget));
            }
            dispatch(syncProjectDocumentsWithEMFS(projectUid, () => {}));
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
