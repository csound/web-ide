
import { LOAD_CSOUND } from "./types";

import CsoundObj from 'CsoundObj';

export const loadCsoundObj = () => {
    return dispatch => {
        dispatch({ type: LOAD_CSOUND.REQUEST });

        CsoundObj.importScripts('https://waaw.csound.com/js/').then(() => {
            dispatch({ type: LOAD_CSOUND.SUCCESS });
        });
    };
};
