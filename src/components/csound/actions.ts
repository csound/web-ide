import { RootState, store } from "@root/store";
import { IProject } from "../projects/types";
import { Csound as Csound6 } from "@csound/browser";
import { Csound as Csound7 } from "csound7";
import {
    cleanupNonCloudFiles,
    nonCloudFiles,
    addNonCloudFile
} from "@comp/file-tree/actions";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import { CsoundObj, ICsoundStatus, SET_CSOUND_PLAY_STATE } from "./types";
import { selectActiveProject } from "@comp/projects/selectors";
import { addDocumentToEMFS } from "@comp/projects/utils";
import { getSelectedTargetDocumentUid } from "@comp/target-controls/selectors";
import { append, difference, isEmpty, path, pathOr, pipe, values } from "ramda";

export let csoundInstance: CsoundObj;

export const setCsoundPlayState = (
    playState: ICsoundStatus
): { type: typeof SET_CSOUND_PLAY_STATE; status: ICsoundStatus } => {
    return {
        type: SET_CSOUND_PLAY_STATE,
        status: playState
    };
};

export const setCsound = (csound: CsoundObj): void => {
    csound.on("realtimePerformanceEnded", async () => {
        try {
            await csound.cleanup();
        } catch {}

        store.dispatch(setCsoundPlayState("stopped"));
    });
    csound.on("realtimePerformancePaused", () =>
        store.dispatch(setCsoundPlayState("paused"))
    );

    csound.on("realtimePerformanceResumed", () =>
        store.dispatch(setCsoundPlayState("playing"))
    );

    csound.on("realtimePerformanceStarted", () =>
        store.dispatch(setCsoundPlayState("playing"))
    );
};

export const syncFs = async (
    csound: CsoundObj,
    projectUid: string,
    storeState: RootState
): Promise<void> => {
    const documents = storeState.ProjectsReducer.projects[projectUid].documents;

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

export const playCsdFromFs = ({
    projectUid,
    csdPath,
    useCsound7
}: {
    projectUid: string;
    csdPath: string;
    useCsound7: boolean;
}): ((dispatch: any, setConsole: any) => Promise<void>) => {
    return async (dispatch: any, setConsole: any) => {
        const Csound = useCsound7 ? Csound7 : Csound6;

        const csoundObj = await Csound({
            useWorker: localStorage.getItem("sab") === "true"
        });

        if (!csoundObj) {
            return;
        }
        csoundInstance = csoundObj;

        setCsound(csoundInstance);

        if (csoundObj && setConsole) {
            setConsole([""]);
            csoundObj.on("message", (message: string) =>
                setConsole(append(message + "\n"))
            );
        }

        if (csoundObj) {
            await csoundObj.setOption("-odac");

            const storeState = store.getState();
            await syncFs(csoundObj, projectUid, storeState);
            const result = await csoundObj.compileCsd(csdPath);

            if (result === 0) {
                const filesPre = await csoundObj.fs.readdir("/");
                csoundObj.once("realtimePerformanceEnded", async () => {
                    const filesPost = await csoundObj.fs.readdir("/");
                    const newFiles = difference(filesPost, filesPre);

                    for (const newFile of newFiles) {
                        const buffer = await csoundObj.fs.readFile(newFile);
                        if (buffer) {
                            nonCloudFiles.set(newFile, {
                                buffer,
                                createdAt: new Date(),
                                name: newFile
                            });
                            dispatch(
                                addNonCloudFile({
                                    createdAt: Date.now(),
                                    name: newFile
                                })
                            );
                        }
                    }

                    await syncFs(csoundObj, projectUid, storeState);
                });
                await csoundObj.start();
                dispatch(setCsoundPlayState("playing"));
            } else {
                try {
                    await csoundObj.cleanup();
                } catch (error: any) {
                    console.error(error);
                }

                dispatch(setCsoundPlayState("error"));
            }
        }
    };
};

export const playORCFromString = ({
    projectUid,
    orc,
    useCsound7
}: {
    projectUid: string;
    orc: string;
    useCsound7: boolean;
}): ((dispatch: any, setConsole: any) => Promise<void>) => {
    return async (dispatch, setConsole: any) => {
        const Csound = useCsound7 ? Csound7 : Csound6;

        const csoundObj = await Csound({
            useWorker: localStorage.getItem("sab") === "true"
        });

        if (!csoundObj) {
            return;
        }

        csoundInstance = csoundObj;

        setCsound(csoundInstance);

        if (csoundObj && setConsole) {
            setConsole([""]);
            csoundObj.on("message", (message: string) =>
                setConsole(append(message + "\n"))
            );
        }

        if (csoundObj) {
            await csoundObj.setOption("-odac");

            const storeState = store.getState();
            await syncFs(csoundObj, projectUid, storeState);

            const result = await csoundObj.compileOrc(orc);

            if (result === 0) {
                await csoundObj.start();
                dispatch(setCsoundPlayState("playing"));
            } else {
                try {
                    await csoundObj.cleanup();
                } catch (error: any) {
                    console.error(error);
                }

                dispatch(setCsoundPlayState("error"));
            }
        }
    };
};

export const stopCsound = () => {
    csoundInstance && csoundInstance.stop();
    return setCsoundPlayState("stopped");
};

export const pauseCsound = () => {
    csoundInstance && csoundInstance.pause();
    return setCsoundPlayState("paused");
};

export const resumePausedCsound = () => {
    csoundInstance && csoundInstance.resume();
    return setCsoundPlayState("playing");
};

export const renderToDisk = (
    setConsole: any
): ((dispatch: (any) => void) => void) => {
    return async (dispatch: any) => {
        const state: RootState = store.getState();
        const project: IProject | undefined = selectActiveProject(state);
        if (project) {
            dispatch(cleanupNonCloudFiles({ projectUid: project.projectUid }));
        }

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
            project.projectUid
        )(state);

        if (!targetDocumentUid) {
            dispatch(
                openSnackbar(
                    "Render error: no target was found for this project",
                    SnackbarType.Error
                )
            );
            return;
        }

        const Csound = Csound6;
        // const Csound = useCsound7 ? Csound7 : Csound6;

        // vanilla mode should work everywhere
        const csound = await Csound({
            useWorker: true
        });

        csoundInstance = csound as CsoundObj;

        if (!csound) {
            dispatch(
                openSnackbar(
                    "Render error: csound failed to start",
                    SnackbarType.Error
                )
            );
            return;
        }

        setConsole([""]);
        csound.on("message", (message: string) =>
            setConsole(append(message + "\n"))
        );

        await syncFs(csound, project.projectUid, state);

        const filesPre = await csound.fs.readdir("/");

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

        csound.once("renderStarted", () => {
            dispatch(setCsoundPlayState("rendering"));
            dispatch(
                openSnackbar(
                    `Render of ${targetDocumentName} started`,
                    SnackbarType.Info
                )
            );
        });

        csound.once("renderEnded", async () => {
            await csound.cleanup();
            const filesPost = await csound.fs.readdir("/");
            const newFiles = difference(filesPost, filesPre);

            for (const newFile of newFiles) {
                const buffer = await csound.fs.readFile(newFile);
                if (buffer) {
                    nonCloudFiles.set(newFile, {
                        buffer,
                        createdAt: new Date(),
                        name: newFile
                    });
                    dispatch(
                        addNonCloudFile({
                            createdAt: Date.now(),
                            name: newFile
                        })
                    );
                }
            }

            await syncFs(csound, project.projectUid, state);

            try {
                await csound.terminateInstance();
            } catch {}

            dispatch(setCsoundPlayState("stopped"));
            dispatch(
                openSnackbar(
                    `Render of ${targetDocumentName} done`,
                    SnackbarType.Success
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

        dispatch(setCsoundPlayState("stopped"));
        await csound.stop();
    };
};
