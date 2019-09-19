import {
    ICsoundObj,
    ICsoundStatus,
    SET_CSOUND,
    SET_CSOUND_PLAY_STATE
} from "./types";

export interface ICsoundReducer {
    csound: ICsoundObj | null;
    status: ICsoundStatus;
}

export default (state: any, action: any): ICsoundReducer => {
    switch (action.type) {
        case SET_CSOUND: {
            return {
                csound: action.csound,
                status: state.status
            };
        }
        case SET_CSOUND_PLAY_STATE: {
            return {
                csound: state.csound,
                status: action.status
            }
        }
        default: {
            return (
                state ||
                ({
                    csound: null,
                    status: "initialized"
                } as ICsoundReducer)
            );
        }
    }
};
