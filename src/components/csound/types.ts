const PREFIX = "CSOUND.";

export type ICsoundStatus =
    | "initialized"
    | "stopped"
    | "paused"
    | "playing"
    | "rendering"
    | "error";

// ACTION TYPES
export const FETCH_CSOUND = PREFIX + "FETCH_CSOUND";
export const SET_CSOUND = PREFIX + "SET_CSOUND";
export const SET_CSOUND_PLAY_STATE = PREFIX + "SET_CSOUND_PLAY_STATE";
export const STOP_RENDER = PREFIX + "STOP_RENDER";
export const SET_STOP_RENDER = PREFIX + "SET_STOP_RENDER";

export type ICsoundFileType = "csd" | "orc" | "sco" | "udo";

// JUST A MOCK (WIP)
export interface ICsoundOptions {
    messageLevel?: number;
    sampleRate?: number;
    ksmps?: number;
}
