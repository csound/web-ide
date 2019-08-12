import { ICsoundObj } from "./interfaces";

export interface ICsoundReducer {
    csound: ICsoundObj | null;
};


export default (state: ICsoundReducer, action: any) => {
    switch (action.type) {
        case "SET_CSOUND": {
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
