const PREFIX = "PROJECTS.";

// ACTION TYPES
export const LOAD_PROJECT_FROM_FIRESTORE =
    PREFIX + "LOAD_PROJECT_FROM_FIRESTORE";
export const SET_PROJECT = PREFIX + "SET_PROJECT";
export const DOCUMENT_UPDATE_VALUE = PREFIX + "DOCUMENT_UPDATE_VALUE";
export const DOCUMENT_NEW = PREFIX + "DOCUMENT_NEW";

// INTERFACES
export interface IDocument {
    currentValue: string;
    documentUid: string;
    savedValue: string;
    filename: string;
}

export interface IProject {
    projectUid: string;
    name: string;
    isPublic: boolean;
    documents: { [documentUid: string]: IDocument };
}

export interface IProjectsReducer {
    activeProject: IProject | null;
}
