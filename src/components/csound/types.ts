import { CsoundObj as CsoundObj6 } from "@csound/browser";
import { CsoundObj as CsoundObj7 } from "csound7";

// Use union type to support both Csound 6 and 7
export type CsoundObj =
    | (CsoundObj6 & { getAudioContext: any })
    | (CsoundObj7 & { getAudioContext: any });

// Type guard to check if we're using Csound 7
export function isCsound7(
    csound: CsoundObj
): csound is CsoundObj7 & { getAudioContext: any } {
    return "compileCSD" in csound;
}

// Helper function to compile CSD with version compatibility
export async function compileCSD(
    csound: CsoundObj,
    csdPath: string,
    isText: boolean = false
): Promise<number> {
    if (isCsound7(csound)) {
        // Csound 7: use compileCSD with mode parameter (0 = path, 1 = text)
        return await csound.compileCSD(csdPath, isText ? 1 : 0);
    } else {
        // Csound 6: use legacy methods
        const csound6 = csound as CsoundObj6 & { getAudioContext: any };
        if (isText && "compileCsdText" in csound6) {
            return await (csound6 as any).compileCsdText(csdPath);
        } else if ("compileCsd" in csound6) {
            return await (csound6 as any).compileCsd(csdPath);
        } else {
            throw new Error("Compilation method not available");
        }
    }
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
