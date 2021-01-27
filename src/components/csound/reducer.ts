import { assoc } from "ramda";
import { Csound, CsoundObj } from "@csound/browser";
import {
    ICsoundStatus,
    FETCH_CSOUND,
    SET_CSOUND,
    SET_CSOUND_PLAY_STATE
} from "./types";

export interface ICsoundReducer {
    factory: Csound | undefined;
    csound: CsoundObj | undefined;
    status: ICsoundStatus;
}

const CsoundReducer = (
    state: ICsoundReducer,
    action: Record<string, any>
): ICsoundReducer => {
    switch (action.type) {
        case FETCH_CSOUND: {
            return assoc("factory", action.factory, state);
        }
        case SET_CSOUND: {
            // store it globally for the Manual!
            // (window as any).csound = action.csound;
            // return {
            //     csound: action.csound,
            //     status: state.status
            // };
            return state;
        }
        case SET_CSOUND_PLAY_STATE: {
            return state;
            // return {
            //     csound: state.csound,
            //     status: action.status
            // };
        }
        default: {
            return state || { status: "initialized" };
        }
    }
};

export default CsoundReducer;
