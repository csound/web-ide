import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IStore } from "../../db/interfaces";
import { loadProjectFromFirestore } from "./actions";

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

    useEffect(() => {
        if (csound && !activeProject) {
            dispatch(loadProjectFromFirestore(projectUid));
        }
    }, [dispatch, csound, activeProject, projectUid]);

    if (activeProject && csound) {
        return <main className={className}>{props.children}</main>;
    } else {
        return (
            <main>
                <h1>LOADING...</h1>
            </main>
        );
    }
};

export default ProjectContext;
