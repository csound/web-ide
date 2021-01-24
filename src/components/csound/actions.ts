import { store } from "@store";
import { IStore } from "@store/types";
import { IDocument, IProject } from "../projects/types";
import { CsoundObj } from "@csound/browser";
import {
    FETCH_CSOUND,
    SET_CSOUND,
    ICsoundStatus,
    SET_CSOUND_PLAY_STATE
} from "./types";
import { selectActiveProject } from "../projects/selectors";
import { saveAs } from "file-saver";
import { path } from "ramda";
import { storageReference } from "../../config/firestore";

export const fetchCsound = (): ((
    dispatch: (any) => void,
    getState: () => IStore
) => Promise<void>) => {
    return async (dispatch: any, getState) => {
        const currentState = getState();
        const constructor = path(["csound", "constructor"], currentState);
        if (!constructor) {
            dispatch({
                type: FETCH_CSOUND,
                constructor: await import("@csound/browser")
            });
        }
    };
};

export const setCsound = (csound: CsoundObj): Record<string, any> => {
    return {
        type: SET_CSOUND,
        csound
    };
};

export const playCSDFromEMFS = (
    projectUid: string,
    emfsPath: string
): ((dispatch: (any) => void) => void) => {
    return async (dispatch: any) => {
        const state = store.getState();
        const cs = path(["csound", "csound"], state);
        const clearConsoleCallback = path(
            ["ConsoleReducer", "clearConsole"],
            state
        );

        if (cs) {
            const playState = cs.getPlayState();
            if (playState === "error") {
                dispatch(setCsoundPlayState("stopped"));
            }
            typeof clearConsoleCallback === "function" &&
                clearConsoleCallback();
            cs.audioContext.resume();
            cs.resetIfNeeded();
            cs.setOption("-odac");
            cs.setOption("-+msg_color=false");
            await cs.setCurrentDirFS(projectUid);
            const result = await cs.compileCSDPromise(emfsPath);
            if (result === 0) {
                dispatch(setCsoundPlayState("playing"));
                cs.start();
            } else {
                dispatch(setCsoundPlayState("error"));
            }
        }
    };
};

export const playCSDFromString = (
    projectUid: string,
    csd: string
): ((dispatch: (any) => void) => void) => {
    return async (dispatch) => {
        const cs = path(["csound", "csound"], store.getState()) as
            | CsoundObj
            | undefined;
        if (cs) {
            // await cs.setCurrentDirFS(projectUid);
            // cs.audioContext.resume();
            cs.setOption("-odac");
            cs.setOption("-+msg_color=false");
            cs.compileCsd(csd);
            cs.start();
            dispatch(setCsoundPlayState("playing"));
        }
    };
};

export const playORCFromString = (
    projectUid: string,
    orc: string
): ((dispatch: (any) => void) => void) => {
    return async (dispatch) => {
        const cs = path(["csound", "csound"], store.getState()) as
            | CsoundObj
            | undefined;
        if (cs) {
            cs.setOption("-odac");
            cs.setOption("-+msg_color=false");
            cs.setOption("-d");
            cs.compileOrc(orc);
            cs.start();
            dispatch(setCsoundPlayState("playing"));
        }

        // FIXME
        // if (cs) {
        //     // await cs.setCurrentDirFS(projectUid);
        //     if (cs.getPlayState() === "paused") {
        //         dispatch(setCsoundPlayState("playing"));
        //         cs.play();
        //     } else {
        //         // cs.audioContext.resume();
        //         // cs.reset();

        //     }
        // }
    };
};

export const stopCsound = (): ((dispatch: (any) => void) => void) => {
    return async (dispatch: any) => {
        const cs = path(["csound", "csound"], store.getState());
        cs.stop();
        // FIXME
        // if (cs && typeof cs.stop === "function") {
        //     dispatch(setCsoundPlayState("stopped"));
        //     cs.stop();
        // } else {
        //     if (cs && typeof cs.getPlayState === "function") {
        //         dispatch(setCsoundPlayState(cs.getPlayState()));
        //     }
        // }
    };
};

export const pauseCsound = (): ((
    dispatch: (any) => void,
    getState: () => IStore
) => void) => {
    return async (dispatch: any, getState) => {
        const cs = path(["csound", "csound"], getState()) as
            | CsoundObj
            | undefined;
        cs && cs.pause();
        dispatch(setCsoundPlayState("paused"));
        // if (cs && cs.getPlayState() === "playing") {
        //     cs.pause();
        //     dispatch(setCsoundPlayState("paused"));
        // } else {
        //     cs && dispatch(setCsoundPlayState(cs.getPlayState()));
        // }
    };
};

export const resumePausedCsound = (): ((
    dispatch: (any) => void,
    getState: () => IStore
) => void) => {
    return async (dispatch: any, getState) => {
        const cs = path(["csound", "csound"], getState()) as
            | CsoundObj
            | undefined;
        cs && cs.resume();
        // FIXME
        // dispatch(setCsoundPlayState("playing"));
        // if (cs && cs.getPlayState() === "paused") {
        //     cs.resume();
        //     dispatch(setCsoundPlayState("playing"));
        // } else {
        //     cs && dispatch(setCsoundPlayState(cs.getPlayState()));
        // }
    };
};

export const setCsoundPlayState = (
    playState: ICsoundStatus
): Record<string, any> => {
    return {
        type: SET_CSOUND_PLAY_STATE,
        status: playState
    };
};

export const renderToDisk = (): ((dispatch: (any) => void) => void) => {
    return async (dispatch: any) => {
        const state: IStore = store.getState();
        const project: IProject | undefined = selectActiveProject(state);
        if (!project) {
            return;
        }

        const encoder = new TextEncoder();

        if (project) {
            const documents: IDocument[] = Object.values(project.documents);
            const worker = new Worker("/csound/CsoundWebWorker.js");

            // eslint-disable-next-line unicorn/prefer-add-event-listener
            worker.onmessage = (event_) => {
                const data = event_.data;
                const content = data[1];

                switch (data[0]) {
                    case "log":
                        console.log("CsoundDisk: " + content);
                        break;
                    case "renderResult":
                        // grab binary data and download as blob
                        saveAs(
                            new Blob([content.buffer], {
                                type: "audio/wav"
                            }),
                            "project-render.wav"
                        );
                        break;
                    default:
                        console.log(
                            "CsoundWebWorker: Unknown Message: " + data[0]
                        );
                        break;
                }
            };

            for (const document_ of documents) {
                if (document_.type === "bin") {
                    const path = `${project.userUid}/${project.projectUid}/${document_.documentUid}`;
                    const url = await storageReference
                        .child(path)
                        .getDownloadURL();

                    const response = await fetch(url);
                    const blob = await response.arrayBuffer();
                    const message = ["writeToFS", document_.filename, blob];
                    worker.postMessage(message);
                } else {
                    const message = [
                        "writeToFS",
                        document_.filename,
                        encoder.encode(document_.savedValue)
                    ];
                    worker.postMessage(message);
                }
            }

            //let d = docs.find(d => d.filename == 'project.csd');

            // TODO - replace with 'main' csd file name
            // if(d) {
            worker.postMessage(["renderCSD", "project.csd"]);
            //}
        }

        // if (cs) {
        //     cs.reset();
        //     cs.setOption("-+msg_color=false");
        //     cs.compileCSD("project.csd");
        //     cs.start();
        // }
    };
};

export const enableMidiInput = (): ((
    dispatch: (any) => void,
    getState: () => IStore
) => void) => {
    return async (dispatch: any, getState) => {
        // FIXME
        // const cs = path(["csound", "csound"], getState()) as
        //     | CsoundObj
        //     | undefined;
        // cs?.enableMidiInput(() => {
        //     console.log("enableMidiInput done");
        // });
    };
};

export const enableAudioInput = (): ((
    dispatch: (any) => void,
    getState: () => IStore
) => void) => {
    return async (dispatch: any, getState) => {
        // FIXME
        // const cs = path(["csound", "csound"], getState()) as
        //     | CsoundObj
        //     | undefined;
        // cs?.enableAudioInput(() => {
        //     console.log("enableAudioInput done");
        // });
    };
};
