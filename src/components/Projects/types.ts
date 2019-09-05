const PREFIX = "PROJECTS.";

// ACTION TYPES
export const SET_PROJECT = PREFIX + "SET_PROJECT";
export const DOCUMENT_RESET = PREFIX + "DOCUMENT_RESET";
export const DOCUMENT_SAVE = PREFIX + "DOCUMENT_SAVE";
export const DOCUMENT_UPDATE_VALUE = PREFIX + "DOCUMENT_UPDATE_VALUE";
export const DOCUMENT_UPDATE_MODIFIED_LOCALLY =
    PREFIX + "DOCUMENT_UPDATE_MODIFIED_LOCALLY";

// INTERFACES
export interface IDocument {
    currentValue: string;
    documentUid: string;
    filename: string;
    savedValue: string;
    type: string;
    isModifiedLocally?: boolean | null;
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
