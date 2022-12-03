import { assoc } from "ramda";
import { CsoundObj } from "@csound/browser";
import {
    ICsoundStatus,
    SET_CSOUND,
    SET_CSOUND_PLAY_STATE,
    STOP_RENDER,
    SET_STOP_RENDER
} from "./types";

export interface ICsoundReducer {
    csound: CsoundObj | undefined;
    status: ICsoundStatus;
    stopRender: (() => void) | undefined;
}

const CsoundReducer = (
    state: ICsoundReducer,
    action: Record<string, any>
): ICsoundReducer => {
    switch (action.type) {
        case SET_CSOUND: {
            return assoc("csound", action.csound, state);
        }
        case SET_CSOUND_PLAY_STATE: {
            return assoc("status", action.status, state);
        }
        case SET_STOP_RENDER: {
            return assoc("stopRender", action.callback, state);
        }
        case STOP_RENDER: {
            if (typeof state.stopRender === "function") {
                state.stopRender();
            }
            return assoc("stopRender", undefined, state);
        }
        default: {
            return state || { status: "initialized" };
        }
    }
};

export default CsoundReducer;
