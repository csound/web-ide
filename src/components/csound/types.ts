import { CsoundObj as CsoundObj6 } from "@csound/browser";
import { CsoundObj as CsoundObj7 } from "csound7";

export interface CsoundObj extends CsoundObj6, CsoundObj7 {
    getAudioContext: any;
}

const PREFIX = "CSOUND.";

export type ICsoundStatus =
    | "initialized"
    | "stopped"
    | "paused"
    | "playing"
    | "rendering"
    | "error";

// ACTION TYPES
export const SET_CSOUND_PLAY_STATE = PREFIX + "SET_CSOUND_PLAY_STATE";

export type ICsoundFileType = "csd" | "orc" | "sco" | "udo";

// JUST A MOCK (WIP)
export interface ICsoundOptions {
    messageLevel?: number;
    sampleRate?: number;
    ksmps?: number;
}
