import { IDocument, IProject } from "./interfaces";
import { merge } from "lodash";

export interface IProjectsReducer {
    projects: IProject[];
};

const defaultInitialDocumentValue: IDocument = {
    currentValue: "",
    lastEdit: null,
    name: "untitled.csd",
    savedValue: "",
    type: "csd",
}

const initialProjectsState: IProjectsReducer = {
    projects:[
        {
            name: "Untitled Project",
            isPublic: false,
            documents: [defaultInitialDocumentValue],
            projectId: 0,
            assets: [],
        }
    ]
}

export default (state: IProjectsReducer, action: any) => {
    switch (action.type) {
        default: {
            return initialProjectsState;
        }
    }
}
