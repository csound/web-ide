import { store } from "@store";
import { IStore } from "@store/types";
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
import { storageRef } from "../../config/firestore";

export const setCsound = (csound: ICsoundObj) => {
    return {
        type: SET_CSOUND,
        csound
    };
};

export const playCSDFromEMFS = (projectUid: string, emfsPath: string) => {
    return async (dispatch: any) => {
        const state = store.getState();
        const cs = pathOr(
            null,
            ["csound", "csound"],
            state
        ) as ICsoundObj | null;
        const clearConsoleCallback: any = pathOr(
            null,
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

export const playCSDFromString = (projectUid: string, csd: string) => {
    return async (dispatch: any) => {
        const cs = pathOr(
            null,
            ["csound", "csound"],
            store.getState()
        ) as ICsoundObj | null;
        if (cs) {
            await cs.setCurrentDirFS(projectUid);
            cs.audioContext.resume();
            cs.setOption("-odac");
            cs.setOption("-+msg_color=false");
            cs.compileCSD(csd);
            cs.start();
            dispatch(setCsoundPlayState("playing"));
        }
    };
};

export const playORCFromString = (projectUid: string, orc: string) => {
    return async (dispatch: any) => {
        const cs = pathOr(
            null,
            ["csound", "csound"],
            store.getState()
        ) as ICsoundObj | null;
        if (cs) {
            await cs.setCurrentDirFS(projectUid);
            if (cs.getPlayState() === "paused") {
                dispatch(setCsoundPlayState("playing"));
                cs.play();
            } else {
                cs.audioContext.resume();
                // cs.reset();
                cs.setOption("-odac");
                cs.setOption("-+msg_color=false");
                cs.setOption("-d");
                cs.compileOrc(orc);
                cs.start();
                dispatch(setCsoundPlayState("playing"));
            }
        }
    };
};

export const stopCsound = () => {
    return async (dispatch: any) => {
        const cs = pathOr(null, ["csound", "csound"], store.getState());
        if (cs && typeof cs.stop === "function") {
            dispatch(setCsoundPlayState("stopped"));
            cs.stop();
        } else {
            if (cs && typeof cs.getPlayState === "function") {
                dispatch(setCsoundPlayState(cs.getPlayState()));
            }
        }
    };
};

export const pauseCsound = () => {
    return async (dispatch: any, getState) => {
        const cs = pathOr(
            null,
            ["csound", "csound"],
            getState()
        ) as ICsoundObj | null;
        if (cs && cs.getPlayState() === "playing") {
            cs.pause();
            dispatch(setCsoundPlayState("paused"));
        } else {
            cs && dispatch(setCsoundPlayState(cs.getPlayState()));
        }
    };
};

export const resumePausedCsound = () => {
    return async (dispatch: any, getState) => {
        const cs = pathOr(
            null,
            ["csound", "csound"],
            getState()
        ) as ICsoundObj | null;
        if (cs && cs.getPlayState() === "paused") {
            cs.resume();
            dispatch(setCsoundPlayState("playing"));
        } else {
            cs && dispatch(setCsoundPlayState(cs.getPlayState()));
        }
    };
};

export const setCsoundPlayState = (playState: ICsoundStatus) => {
    return {
        type: SET_CSOUND_PLAY_STATE,
        status: playState
    };
};

export const renderToDisk = () => {
    return async (dispatch: any) => {
        const state: IStore = store.getState();
        const project: IProject | null = selectActiveProject(state);
        if (project === null) return;

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

            for (let i = 0; i < docs.length; i++) {
                let doc = docs[i];
                if (doc.type === "bin") {
                    const path = `${project.userUid}/${project.projectUid}/${doc.documentUid}`;
                    const url = await storageRef.child(path).getDownloadURL();

                    const response = await fetch(url);
                    const blob = await response.arrayBuffer();
                    let msg = ["writeToFS", doc.filename, blob];
                    worker.postMessage(msg);
                } else {
                    let msg = [
                        "writeToFS",
                        doc.filename,
                        encoder.encode(doc.savedValue)
                    ];
                    worker.postMessage(msg);
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

export const enableMidiInput = () => {
    return async (dispatch: any, getState) => {
        const cs = pathOr(
            null,
            ["csound", "csound"],
            getState()
        ) as ICsoundObj | null;
        cs?.enableMidiInput(() => {
            console.log("enableMidiInput done");
        });
    }
};

export const enableAudioInput = () => {
    return async (dispatch: any, getState) => {
        const cs = pathOr(
            null,
            ["csound", "csound"],
            getState()
        ) as ICsoundObj | null;
        cs?.enableAudioInput(() => {
            console.log("enableAudioInput done");
        });
    }
};
