const PREFIX = "PROJECTS.";

// ACTION TYPES
export const CLOSE_PROJECT = PREFIX + "CLOSE_PROJECT";
export const SET_PROJECT = PREFIX + "SET_PROJECT";
export const DOCUMENT_INITIALIZE = PREFIX + "DOCUMENT_INITIALIZE";
export const DOCUMENT_RESET = PREFIX + "DOCUMENT_RESET";
export const DOCUMENT_SAVE = PREFIX + "DOCUMENT_SAVE";
export const DOCUMENT_UPDATE_VALUE = PREFIX + "DOCUMENT_UPDATE_VALUE";
export const DOCUMENT_UPDATE_MODIFIED_LOCALLY =
    PREFIX + "DOCUMENT_UPDATE_MODIFIED_LOCALLY";

export type IDocumentFileType = "csd" | "orc" | "sco" | "udo" | "txt";
export type IDocumentFileInternalType = "txt" | "bin";

// INTERFACES
export interface IDocument {
    currentValue: string;
    documentUid: string;
    filename: string;
    savedValue: string;
    type: IDocumentFileInternalType;
    isModifiedLocally?: boolean | null;
}

export interface IProject {
    userUid: string;
    projectUid: string;
    name: string;
    isPublic: boolean;
    documents: { [documentUid: string]: IDocument };
}

export interface IProjectsReducer {
    activeProject: IProject | null;
}
