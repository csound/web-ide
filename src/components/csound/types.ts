import type { Csound as BrowserCsoundFactory } from "@csound/browser";
import type { ReadlineEngine } from "../console/readline";

export type CsoundObj = NonNullable<Awaited<ReturnType<BrowserCsoundFactory>>> &
    ReadlineEngine & {
        getAudioContext: any;
        // Exported by @csound/browser, but missing from its CsoundObj declaration.
        isRequestingRtAudioInput: () => Promise<number>;
    };

export async function compileCSD(
    csound: CsoundObj,
    csdPath: string,
    isText: boolean = false
): Promise<number> {
    return await csound.compileCSD(csdPath, isText ? 1 : 0);
}

const PREFIX = "CSOUND.";

export type ICsoundStatus =
    | "initialized"
    | "loading"
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
