import { ICsoundOptions } from "../Csound/types";

const PREFIX = "PROJECTS.";

// ACTION TYPES
export const ACTIVATE_PROJECT = PREFIX + "ACTIVATE_PROJECT";
export const CLOSE_PROJECT = PREFIX + "CLOSE_PROJECT";
export const SET_PROJECT = PREFIX + "SET_PROJECT";
export const SET_PROJECT_FILES = PREFIX + "SET_PROJECT_FILES";
export const SET_PROJECT_TARGETS = PREFIX + "SET_PROJECT_TARGETS";
export const DOCUMENT_INITIALIZE = PREFIX + "DOCUMENT_INITIALIZE";
export const DOCUMENT_RENAME_LOCALLY = PREFIX + "DOCUMENT_RENAME_LOCALLY";
export const DOCUMENT_RESET = PREFIX + "DOCUMENT_RESET";
export const DOCUMENT_SAVE = PREFIX + "DOCUMENT_SAVE";
export const DOCUMENT_UPDATE_VALUE = PREFIX + "DOCUMENT_UPDATE_VALUE";
export const DOCUMENT_UPDATE_MODIFIED_LOCALLY =
    PREFIX + "DOCUMENT_UPDATE_MODIFIED_LOCALLY";

export type IDocumentFileType = "csd" | "orc" | "sco" | "udo" | "txt";
export type IDocumentFileInternalType = "txt" | "bin";
export type ITarget = IMainTarget | IPlaylist;

// INTERFACES
export interface IDocument {
    currentValue: string;
    documentUid: string;
    filename: string;
    savedValue: string;
    type: IDocumentFileInternalType;
    isModifiedLocally?: boolean | null;
}

export interface IMainTarget {
    csoundOptions: ICsoundOptions;
    targetDocumentUid: string;
    targetName: string;
}

export interface IPlaylist {
    csoundOptions: ICsoundOptions;
    playlistDocumentsUid: string[];
    targetName: string;
}

export interface IProject {
    userUid: string;
    projectUid: string;
    name: string;
    isPublic: boolean;
    defaultTarget: string | null;
    targets: { [targetName: string]: ITarget };
    documents: { [documentUid: string]: IDocument };
}

export interface IProjectsReducer {
    activeProjectUid: string | null;
    projects: { [projectUid: string]: IProject };
}
