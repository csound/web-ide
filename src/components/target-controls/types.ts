import { ICsoundOptions } from "@comp/csound/types";

const PREFIX = "TARGET_CONTROL.";

// ACTION TYPES
export const SET_SELECTED_TARGET = PREFIX + "SET_SELECTED_TARGET";
export const UPDATE_ALL_TARGETS_LOCALLY = PREFIX + "UPDATE_ALL_TARGETS_LOCALLY";
export const UPDATE_TARGET_LOCALLY = PREFIX + "UPDATE_TARGET_LOCALLY";
export const UPDATE_DEFAULT_TARGET_LOCALLY =
    PREFIX + "UPDATE_DEFAULT_TARGET_LOCALLY";

export interface ITarget {
    csoundOptions: ICsoundOptions;
    targetName: string;
    targetType: string;
    targetDocumentUid?: string;
    playlistDocumentsUid?: string[];
}

export type ITargetMap = { [targetName: string]: ITarget };
