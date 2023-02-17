import { assoc } from "ramda";
import { ICsoundStatus, SET_CSOUND_PLAY_STATE } from "./types";

export interface ICsoundReducer {
    status: ICsoundStatus;
}

const CsoundReducer = (
    state: ICsoundReducer,
    action: Record<string, any>
): ICsoundReducer => {
    switch (action.type) {
        case SET_CSOUND_PLAY_STATE: {
            return assoc("status", action.status, state);
        }
        default: {
            return state || { status: "initialized" };
        }
    }
};

export default CsoundReducer;
