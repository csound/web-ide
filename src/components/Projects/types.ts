import { Timestamp } from "@config/firestore";

const PREFIX = "PROJECTS.";

// ACTION TYPES
export const ACTIVATE_PROJECT = PREFIX + "ACTIVATE_PROJECT";
export const ADD_PROJECT_DOCUMENTS = PREFIX + "ADD_PROJECT_DOCUMENTS";
export const CLOSE_PROJECT = PREFIX + "CLOSE_PROJECT";
export const SET_PROJECT = PREFIX + "SET_PROJECT";
export const SET_PROJECT_PUBLIC = PREFIX + "SET_PROJECT_PUBLIC";
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
    createdAt: Timestamp | null;
    documentUid: string;
    filename: string;
    lastModified: Timestamp | null;
    savedValue: string;
    type: IDocumentFileType;
    userUid: string;
    isModifiedLocally: boolean;
    path: string[];
}

export type IDocumentsMap = { [documentUid: string]: IDocument };

export interface IProject {
    userUid: string;
    projectUid: string;
    name: string;
    isPublic: boolean;
    documents: IDocumentsMap;
    cachedProjectLastModified: Timestamp | null;
    stars: string[];
}

export interface IProjectsReducer {
    activeProjectUid: string | null;
    projects: { [projectUid: string]: IProject };
}
