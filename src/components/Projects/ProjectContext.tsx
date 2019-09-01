import React from "react";
import { connect } from "react-redux";
import { IProject } from "./types";
import { IStore } from "../../db/interfaces";
import { loadProjectFromFirestore } from "./actions";

interface IProjectContextProps {
    activeProject: IProject;
    className: string;
    children: JSX.Element[] | JSX.Element;
    loadProjectFromFirestore: (projectUid: string) => void;
    match: any;
}

class ProjectContext extends React.Component<IProjectContextProps, {}> {
    componentDidMount() {
        const projectUid = this.props.match.params.id;
        if (projectUid) {
            // FIXME: get project from Firebase
            this.props.loadProjectFromFirestore(projectUid);
        } else {
        }
    }

    render() {
        const { activeProject, className } = this.props;

        if (activeProject) {
            return <main className={className}>{this.props.children}</main>;
        } else {
            return (
                <main>
                    <h1>LOADING...</h1>
                </main>
            );
        }
    }
}

const mapStateToProps = (store: IStore, ownProp: any) => {
    return {
        activeProject: store.projects.activeProject
    };
};

const mapDispatchToProps = (dispatch: any): any => ({
    loadProjectFromFirestore: (projectUid: string) =>
        dispatch(loadProjectFromFirestore(projectUid))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ProjectContext);
