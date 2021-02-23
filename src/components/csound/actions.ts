import { store } from "@store";
import { IStore } from "@store/types";
import { IProject } from "../projects/types";
import { CsoundObj, Csound } from "@csound/browser";
import { openSimpleModal } from "@comp/modal/actions";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import {
    FETCH_CSOUND,
    SET_CSOUND,
    ICsoundStatus,
    SET_CSOUND_PLAY_STATE
} from "./types";
import { selectActiveProject } from "@comp/projects/selectors";
import { selectCsoundFactory } from "./selectors";
import { addDocumentToEMFS } from "@comp/projects/utils";
import { getSelectedTargetDocumentUid } from "@comp/target-controls/selectors";
import RenderModal from "./render-modal";
import { isEmpty, path, pathOr, pipe, values } from "ramda";
// import { storageReference } from "@config/firestore";

export const setCsoundPlayState = (
    playState: ICsoundStatus
): Record<string, any> => {
    return {
        type: SET_CSOUND_PLAY_STATE,
        status: playState
    };
};

export const setCsound = (csound: CsoundObj, dispatch: (any) => void): void => {
    csound.on("realtimePerformanceEnded", () => {
        dispatch(setCsoundPlayState("stopped"));
    });
    csound.on("realtimePerformancePaused", () =>
        dispatch(setCsoundPlayState("paused"))
    );

    csound.on("realtimePerformanceResumed", () =>
        dispatch(setCsoundPlayState("playing"))
    );

    csound.on("realtimePerformanceStarted", () =>
        dispatch(setCsoundPlayState("playing"))
    );
    dispatch({
        type: SET_CSOUND,
        csound
    });
};

export const newCsound = async (
    Csound: Csound,
    dispatch: (any) => void
): Promise<CsoundObj | undefined> => {
    // eslint-disable-next-line unicorn/prevent-abbreviations
    const csoundObj = await Csound({ useWorker: false });
    if (!csoundObj) {
        dispatch(setCsoundPlayState("error"));
    } else {
        setCsound(csoundObj, dispatch);
        return csoundObj;
    }
};

export const fetchCsound = async (dispatch: (any) => void): Promise<Csound> => {
    const { Csound } = await import("@csound/browser");
    if (Csound) {
        dispatch({
            type: FETCH_CSOUND,
            factory: Csound
        });
    }
    return Csound;
};

export const syncFs = async (
    csound: CsoundObj,
    projectUid: string,
    storeState: IStore
): Promise<void> => {
    const documents = pipe(
        pathOr({}, ["ProjectsReducer", "projects", projectUid, "documents"]),
        values
    )(storeState);

    for (const document of documents) {
        // reminder: paths are store by document ref and not
        // the actual filesystem name
        const realPath = document.path.map((documentId) =>
            path(
                [
                    "ProjectsReducer",
                    "projects",
                    projectUid,
                    "documents",
                    documentId,
                    "name"
                ],
                storeState
            )
        );
        const filepath = isEmpty(realPath)
            ? document.filename
            : realPath.join("/") + "/" + document.filename;
        await addDocumentToEMFS(projectUid, csound, document, filepath);
    }
};

export const fetchSetStartCsound = (
    activeProjectUid: string,
    playCallback: (dispatch: any, csound: CsoundObj) => void
): ((dispatch: (any) => void) => Promise<void>) => {
    return async (dispatch: any) => {
        const Csound = await fetchCsound(dispatch);
        // eslint-disable-next-line unicorn/prevent-abbreviations
        const csoundObj = await newCsound(Csound, dispatch);

        if (!csoundObj) {
            dispatch(
                openSnackbar(
                    "Error: fetching csound failed",
                    SnackbarType.Error
                )
            );
            return;
        }

        const storeState: IStore = store.getState();

        await syncFs(csoundObj, activeProjectUid, storeState);
        playCallback && (await playCallback(dispatch, csoundObj));
    };
};

export const playCsdFromFs = (
    projectUid: string,
    csdPath: string
): ((dispatch: any, csound: CsoundObj | undefined) => Promise<void>) => {
    return async (dispatch: any, csound) => {
        const state = store.getState();

        // eslint-disable-next-line unicorn/prevent-abbreviations
        const csoundObj = csound || path(["csound", "csound"], state);
        const csoundStatus = csound || path(["csound", "status"], state);

        const clearConsoleCallback = path(
            ["ConsoleReducer", "clearConsole"],
            state
        );

        if (csoundObj) {
            typeof clearConsoleCallback === "function" &&
                clearConsoleCallback();
            csoundStatus !== "initialized" && (await csoundObj.reset());
            csoundObj.setOption("-odac");
            csoundObj.setOption("-+msg_color=false");

            await syncFs(csoundObj, projectUid, state);
            const result = await csoundObj.compileCsd(csdPath);

            if (result === 0) {
                await csoundObj.start();
            } else {
                dispatch(setCsoundPlayState("error"));
            }
        }
    };
};

export const playCSDFromString = (
    projectUid: string,
    csd: string
): ((dispatch: any, csound: CsoundObj | undefined) => Promise<void>) => {
    return async (dispatch, csound) => {
        const cs =
            csound ||
            (path(["csound", "csound"], store.getState()) as
                | CsoundObj
                | undefined);
        if (cs) {
            // await cs.setCurrentDirFS(projectUid);
            // cs.audioContext.resume();
            cs.setOption("-odac");
            cs.setOption("-+msg_color=false");
            const storeState = store.getState();
            await syncFs(cs, projectUid, storeState);

            cs.compileCsdText(csd);
            cs.start();
            dispatch(setCsoundPlayState("playing"));
        }
    };
};

export const playORCFromString = (
    projectUid: string,
    orc: string
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch) => {
        const cs = path(["csound", "csound"], store.getState()) as
            | CsoundObj
            | undefined;
        if (cs) {
            cs.setOption("-odac");
            cs.setOption("-+msg_color=false");
            cs.setOption("-d");

            const storeState = store.getState();
            await syncFs(cs, projectUid, storeState);

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
        cs && cs.stop();
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
        cs && (await cs.pause());

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
    };
};

function lsAll(fs, tree = {}, root = "/") {
    if (fs.existsSync(root)) {
        fs.readdirSync(root).forEach((file) => {
            const currentPath = `${root}/${file}`.replace("//", "/");
            if (fs.lstatSync(currentPath).isDirectory()) {
                return (tree[currentPath] = lsAll(fs, tree, currentPath));
            } else {
                tree[currentPath] = fs.statSync(currentPath).size;
            }
        });
        return tree;
    }
}

export const renderToDisk = (): ((dispatch: (any) => void) => void) => {
    return async (dispatch: any) => {
        const state: IStore = store.getState();
        const project: IProject | undefined = selectActiveProject(state);

        if (!project) {
            dispatch(
                openSnackbar(
                    "Render error: no project is currently selected",
                    SnackbarType.Error
                )
            );
            return;
        }

        const targetDocumentUid = getSelectedTargetDocumentUid(
            project.projectUid,
            state
        );

        if (!targetDocumentUid) {
            dispatch(
                openSnackbar(
                    "Render error: no target was found for this project",
                    SnackbarType.Error
                )
            );
            return;
        }

        let Csound = selectCsoundFactory(state);

        if (!Csound) {
            Csound = await fetchCsound(dispatch);
        }

        // vanilla mode should work everywhere
        const csound = await Csound({ useWorker: true, useSAB: false });

        if (!csound) {
            dispatch(
                openSnackbar(
                    "Render error: csound failed to start",
                    SnackbarType.Error
                )
            );
            return;
        }
        await syncFs(csound, project.projectUid, state);
        const preStartTree = lsAll(csound.fs);

        csound.on("renderEnded", () => {
            dispatch(
                openSimpleModal(RenderModal, {
                    csound,
                    preStartTree,
                    disableOnClose: true
                })
            );
        });

        const targetDocumentName =
            project.documents[targetDocumentUid].filename;

        targetDocumentName.endsWith("csd")
            ? await csound.compileCsd(targetDocumentName)
            : await csound.compileOrc(
                  project.documents[targetDocumentUid].currentValue
              );

        // logic: if the user specified output name, we use it
        // otherwise we'll default to the filename dot wav
        let outputName = await csound.getOutputName();

        if (
            typeof outputName !== "string" ||
            outputName.length === 0 ||
            outputName === "dac"
        ) {
            outputName = `${targetDocumentName.split(".")[0]}.wav`;
            await csound.setOption(`-o${outputName}`);
        }

        csound.on("renderStarted", () => {
            dispatch(
                openSnackbar(
                    `Render of ${targetDocumentName} started`,
                    SnackbarType.Info
                )
            );
        });

        const result = await csound.start();

        if (result !== 0) {
            dispatch(
                openSnackbar(
                    "Render error: the project encountered an error while rendering",
                    SnackbarType.Error
                )
            );
        }
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
