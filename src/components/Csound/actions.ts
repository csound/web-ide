import { store } from "../../store";
import {
    ICsoundObj,
    SET_CSOUND,
    ICsoundStatus,
    SET_CSOUND_PLAY_STATE
} from "./types";
import { IStore } from "../../db/interfaces";

export const setCsound = (csound: ICsoundObj) => {
    return {
        type: SET_CSOUND,
        csound
    };
};

export const runCsound = () => {
    return async (dispatch: any) => {
        let cs = store.getState().csound.csound;

        if (cs) {
            cs.audioContext.resume();
            cs.reset();
            cs.setOption("-odac");
            cs.setOption("-+msg_color=false");
            cs.compileCSD("project.csd");
            cs.start();
        }
    };
};

export const playCSD = (csd: string) => {
    return async (dispatch: any) => {
        let cs = store.getState().csound.csound;

        if (cs) {
            cs.audioContext.resume();
            cs.reset();
            cs.setOption("-odac");
            cs.setOption("-+msg_color=false");
            cs.compileCSD(csd);
            cs.start();
        }
    };
};

export const stopCsound = () => {
    return async (dispatch: any) => {
        let cs = store.getState().csound.csound;

        if (cs) {
            cs.reset();
        }
    };
};

export const playPauseCsound = () => {
    return async (dispatch: any) => {
        let cs = store.getState().csound.csound;

        if (cs) {
            switch (cs.getPlayState()) {
                case "playing":
                    cs.stop();
                    break;
                case "paused":
                    cs.play();
                    break;
                // ignore other cases
            }
        }
    };
};

export const setCsoundPlayState = (playState: ICsoundStatus) => {
    return {
        type: SET_CSOUND_PLAY_STATE,
        status: playState
    };
};

export const writeDocumentToEMFS = (path: string, text: string): void => {
    const storeState = store.getState() as IStore;
    const csound = storeState.csound.csound;
    console.log(csound);
};
