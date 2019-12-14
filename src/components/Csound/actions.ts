import { store } from "../../store";
import { IDocument, IProject } from "../Projects/types";
import {
    ICsoundObj,
    SET_CSOUND,
    ICsoundStatus,
    SET_CSOUND_PLAY_STATE
} from "./types";
import { selectActiveProject } from "../Projects/selectors";
import { saveAs } from "file-saver";
import { pathOr } from "ramda";

export const setCsound = (csound: ICsoundObj) => {
    return {
        type: SET_CSOUND,
        csound
    };
};

export const runCsound = () => {
    return async (dispatch: any) => {
        const cs = pathOr(null, ["csound", "csound"], store.getState());
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
        const cs = pathOr(null, ["csound", "csound"], store.getState());
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
        const cs = pathOr(null, ["csound", "csound"], store.getState());

        if (cs) {
            cs.reset();
        }
    };
};

export const playPauseCsound = () => {
    return async (dispatch: any) => {
        const cs = pathOr(null, ["csound", "csound"], store.getState());
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
    // const storeState = store.getState() as IStore;
    // const csound = pathOr(null, ["csound", "csound"], storeState);
    // console.log(csound);
};

export const renderToDisk = () => {
    return async (dispatch: any) => {
        const state = store.getState();
        const project: IProject = selectActiveProject(state);
        const encoder = new TextEncoder();

        if (project) {
            let documents = project.documents;
            let docs: IDocument[] = Object.values(documents);

            let worker = new Worker("/csound/CsoundWebWorker.js");

            worker.onmessage = evt => {
                const data = evt.data;
                const content = data[1];

                switch (data[0]) {
                    case "log":
                        console.log("CsoundDisk: " + content);
                        break;
                    case "renderResult":
                        // grab binary data and download as blob
                        const wav = new Blob([content.buffer], {
                            type: "audio/wav"
                        });
                        saveAs(wav, "project-render.wav");
                        break;
                    default:
                        console.log(
                            "CsoundWebWorker: Unknown Message: " + data[0]
                        );
                        break;
                }
            };

            docs.forEach(doc => {
                let msg = [
                    "writeToFS",
                    doc.filename,
                    encoder.encode(doc.savedValue)
                ];
                worker.postMessage(msg);
            });

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
