import { ICsoundObj, SET_CSOUND } from "./types";

export interface ICsoundReducer {
    csound: ICsoundObj | null;
};


export default (state: ICsoundReducer = {csound: null}, action: any) => {
    switch (action.type) {
        case SET_CSOUND: {
            return {
                csound: action.csound,
            };
        }
        default: {
            return state || {
                csound: null,
            };
        }
    }
}
