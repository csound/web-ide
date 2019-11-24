import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IStore } from "../../db/interfaces";
import {
    // closeProject,
    loadProjectFromFirestore,
    syncProjectDocumentsWithEMFS,
    openProjectDocumentTabs
} from "./actions";
// import { closeTabDock } from "../ProjectEditor/actions";
import { isEmpty } from "lodash";

interface IProjectContextProps {
    className: string;
    children: JSX.Element[] | JSX.Element;
    match: any;
}

export const ProjectContext = (props: IProjectContextProps) => {
    const dispatch = useDispatch();
    const projectUid = props.match.params.id;
    const { className } = props;
    const activeProject = useSelector(
        (store: IStore) => store.projects.activeProject
    );
    const csound = useSelector((store: IStore) => store.csound.csound);
    const needsLoading =
        isEmpty(activeProject) ||
        (activeProject && projectUid !== activeProject.projectUid);

    useEffect(() => {
        if (needsLoading && csound) {
            dispatch(loadProjectFromFirestore(projectUid));
        }
    }, [dispatch, projectUid, needsLoading, csound]);

    useEffect(() => {
        if (activeProject) {
            dispatch(openProjectDocumentTabs());
            dispatch(syncProjectDocumentsWithEMFS(projectUid));
        }
    }, [dispatch, activeProject, projectUid]);

    if (!needsLoading && csound) {
        return (
            <div>
                <main className={className}>{props.children}</main>
            </div>
        );
    } else {
        return (
            <main>
                <h1>LOADING...</h1>
            </main>
        );
    }
};

export default ProjectContext;
