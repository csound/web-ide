import React from "react";
import { connect } from "react-redux";
import { ICsoundObj } from "./interfaces";
import { IDocument, IProject } from "../Projects/interfaces";
import { IStore } from "../../db/interfaces";
import { find } from "lodash";

interface ICsoundComponentProps {
    activeProjectUid: string;
    csound: ICsoundObj | null;
    children: JSX.Element[] | JSX.Element
    project: IProject;
}

class CsoundComponent extends React.Component<ICsoundComponentProps, {}> {

    public componentDidMount() {

        const initProjectInterval = setInterval(() => {
            if (this.props.csound) {
                clearInterval(initProjectInterval);
                Object.values(this.props.project.documents).forEach((document: IDocument) => {
                    this.props.csound && this.props.csound.writeToFS(document.name, document.savedValue);
                });
            }
        }, 50);
    }

    public render() {
        return (
            <div>{this.props.children}</div>
        )
    }
}

const mapStateToProps = (store: IStore, ownProp: any) => {

    const activeProjectUid = store.ProjectsReducer.activeProjectUid;
    const project = find(store.ProjectsReducer.projects, p => p.projectUid === activeProjectUid);

    return {
        activeProjectUid,
        csound: store.csound.csound,
        project,
    }
}

export default connect(mapStateToProps, {})(CsoundComponent);
