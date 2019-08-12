//import CsoundObj from "./CsoundObj";
import { ICsoundObj } from "./interfaces";

export const setCsound = (csound: ICsoundObj) => {
    return {
        type: "SET_CSOUND",
        csound, 
    };
};
