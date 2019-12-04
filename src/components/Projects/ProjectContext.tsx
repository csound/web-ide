import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IStore } from "../../db/interfaces";
import Header from "../Header/Header";
import {
    loadProjectFromFirestore,
    openProjectDocumentTabs,
    syncProjectDocumentsWithEMFS
} from "./actions";
import * as SS from "./styles";
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

    if (activeProject && activeProject.projectUid && !needsLoading && csound) {
        return (
            <>
                <Header />
                <main css={SS.main} className={className}>
                    {props.children}
                </main>
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
