const PREFIX = "PROJECTS.";

// ACTION TYPES
export const ACTIVATE_PROJECT = PREFIX + "ACTIVATE_PROJECT";
export const ADD_PROJECT_DOCUMENTS = PREFIX + "ADD_PROJECT_DOCUMENTS";
export const CLOSE_PROJECT = PREFIX + "CLOSE_PROJECT";
export const STORE_PROJECT_LOCALLY = PREFIX + "STORE_PROJECT_LOCALLY";
export const SET_PROJECT_PUBLIC = PREFIX + "SET_PROJECT_PUBLIC";
export const STORE_PROJECT_STARS = PREFIX + "STORE_PROJECT_STARS";
export const UNSET_PROJECT = PREFIX + "UNSET_PROJECT";
export const DOCUMENT_INITIALIZE = PREFIX + "DOCUMENT_INITIALIZE";
export const DOCUMENT_RENAME_LOCALLY = PREFIX + "DOCUMENT_RENAME_LOCALLY";
export const DOCUMENT_REMOVE_LOCALLY = PREFIX + "DOCUMENT_REMOVE_LOCALLY";
export const DOCUMENT_RESET = PREFIX + "DOCUMENT_RESET";
export const DOCUMENT_SAVE = PREFIX + "DOCUMENT_SAVE";
export const DOCUMENT_UPDATE_VALUE = PREFIX + "DOCUMENT_UPDATE_VALUE";
export const DOCUMENT_UPDATE_MODIFIED_LOCALLY =
    PREFIX + "DOCUMENT_UPDATE_MODIFIED_LOCALLY";

export type IDocumentFileType = "txt" | "bin" | "folder";

// INTERFACES
export interface IDocument {
    currentValue: string;
    created: number | undefined;
    documentUid: string;
    filename: string;
    lastModified: number | undefined;
    savedValue: string;
    type: IDocumentFileType;
    userUid: string;
    isModifiedLocally: boolean;
    path: string[];
}

export type IDocumentsMap = { [documentUid: string]: IDocument };

type IStar = { [userUid: string]: number };

export interface IProject {
    description: string;
    userUid: string;
    projectUid: string;
    name: string;
    isPublic: boolean;
    documents: IDocumentsMap;
    cachedProjectLastModified?: number;
    iconBackgroundColor?: string;
    iconForegroundColor?: string;
    iconName?: string;
    // only local path, NOT stored there on firestore
    stars: IStar;
    tags: string[];
}

export interface IProjectsReducer {
    activeProjectUid?: string;
    projects: { [projectUid: string]: IProject };
}
