import { Timestamp } from "firebase/firestore";
import { UPDATE_PROJECT_LAST_MODIFIED_LOCALLY } from "../project-last-modified/types";
export { UPDATE_PROJECT_LAST_MODIFIED_LOCALLY } from "../project-last-modified/types";

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

export interface AddProjectDocumentsAction {
    type: typeof ADD_PROJECT_DOCUMENTS;
    projectUid: string;
    documents: Record<string, IDocument>;
}

export interface ActivateProjectAction {
    type: typeof ACTIVATE_PROJECT;
    projectUid: string;
}

export interface DocumentResetAction {
    type: typeof DOCUMENT_RESET;
    documentUid: string;
    projectUid: string;
}

export interface DocumentUpdateModifiedLocallyAction {
    type: typeof DOCUMENT_UPDATE_MODIFIED_LOCALLY;
    documentUid: string;
    projectUid: string;
    isModified: boolean;
}

export interface DocumentInitializeAction {
    type: typeof DOCUMENT_INITIALIZE;
    documentUid: string;
    projectUid: string;
    filename: string;
}

export interface DocumentRenameLocallyAction {
    type: typeof DOCUMENT_RENAME_LOCALLY;
    documentUid: string;
    projectUid: string;
    newFilename: string;
}

export interface DocumentRemoveLocallyAction {
    type: typeof DOCUMENT_REMOVE_LOCALLY;
    documentUid: string;
    projectUid: string;
}

export interface DocumentSaveAction {
    type: typeof DOCUMENT_SAVE;
    document: IDocument;
    projectUid: string;
}

export interface DocumentUpdateValueAction {
    type: typeof DOCUMENT_UPDATE_VALUE;
    documentUid: string;
    projectUid: string;
    val: string;
}

export interface CloseProjectAction {
    type: typeof CLOSE_PROJECT;
}

export interface StoreProjectLocallyAction {
    type: typeof STORE_PROJECT_LOCALLY;
    projects: IProject[];
}

export interface StoreProjectStarsAction {
    type: typeof STORE_PROJECT_STARS;
    projectUid: string;
    stars: Star;
}

export interface SetProjectPublicAction {
    type: typeof SET_PROJECT_PUBLIC;
    projectUid: string;
    isPublic: boolean;
}
export interface UnsetProjectAction {
    projectUid: string;
    type: typeof UNSET_PROJECT;
}

export interface UpdateProjectLastModifiedLocallyAction {
    type: typeof UPDATE_PROJECT_LAST_MODIFIED_LOCALLY;
    projectUid: string;
    lastModified: number;
    timestamp: number;
}

export type ProjectsActionTypes =
    | ActivateProjectAction
    | AddProjectDocumentsAction
    | DocumentResetAction
    | DocumentUpdateModifiedLocallyAction
    | DocumentInitializeAction
    | DocumentRemoveLocallyAction
    | DocumentSaveAction
    | DocumentUpdateValueAction
    | StoreProjectStarsAction
    | CloseProjectAction
    | UnsetProjectAction
    | StoreProjectLocallyAction
    | SetProjectPublicAction
    | UpdateProjectLastModifiedLocallyAction;

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

// export type IDocumentsMap = { [documentUid: string]: IDocument };

export type Star = { [userUid: string]: number };

export interface IProject {
    created?: Timestamp;
    description: string;
    userUid: string;
    projectUid: string;
    name: string;
    isPublic: boolean;
    documents: Record<string, IDocument>;
    cachedProjectLastModified?: number;
    iconBackgroundColor?: string;
    iconForegroundColor?: string;
    iconName?: string;
    // only local path, NOT stored there on firestore
    stars: Star;
    tags: string[];
}

export interface IProjectsReducer {
    activeProjectUid?: string;
    projects: { [projectUid: string]: IProject };
}

export interface CsoundFile {
    filename: string;
    path: string[];
    lastModified: number | undefined;
    type: IDocumentFileType;
}
