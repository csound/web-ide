import React, { useEffect, useState } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { useTheme } from "@emotion/react";
import { TailSpin } from "react-loader-spinner";
import * as SS from "./styles";
import Tooltip from "@mui/material/Tooltip";
import { pathOr } from "ramda";
import { getPlayActionFromProject, getPlayActionFromTarget } from "./utils";
import { selectSelectedTarget, selectDefaultTargetDocument } from "./selectors";
import { useSetConsole } from "@comp/console/context";
import { pauseCsound, resumePausedCsound } from "@comp/csound/actions";
import { saveAllFiles } from "@comp/projects/actions";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";

const TailSpinAny = TailSpin as any;

const PlayButton = ({
    activeProjectUid,
    isOwner
}: {
    activeProjectUid: string;
    isOwner: boolean;
}) => {
    const setConsole = useSetConsole();
    const [isLoading, setIsLoading] = useState(false);

    const theme = useTheme();

    const playActionDefault = useSelector(
        getPlayActionFromTarget(activeProjectUid)
    );

    const playActionFallback = useSelector(
        getPlayActionFromProject(activeProjectUid)
    );

    const csoundPlayState: string = useSelector((store: RootState) => {
        return store.csound.status;
    });

    useEffect(() => {
        if (csoundPlayState === "stopped" && isLoading) {
            setIsLoading(false);
        }
    }, [csoundPlayState]);

    const selectedTargetName: string | null = useSelector(
        selectSelectedTarget(activeProjectUid)
    );

    const fallbackTargetDocument: any = useSelector((state: RootState) =>
        selectDefaultTargetDocument(state, activeProjectUid)
    );

    const dispatch = useDispatch();

    const tooltipText =
        !selectedTargetName && !fallbackTargetDocument
            ? ""
            : csoundPlayState === "playing"
              ? "pause playback"
              : csoundPlayState === "paused"
                ? "resume playback"
                : `run ${selectedTargetName || fallbackTargetDocument.filename}`;

    const playAction = playActionDefault || playActionFallback;

    return csoundPlayState === "rendering" ? (
        <></>
    ) : (
        <Tooltip title={isLoading ? "loading..." : tooltipText}>
            <div
                css={SS.playButtonContainer}
                onClick={async () => {
                    if (isLoading) {
                        return;
                    }
                    setIsLoading(true);

                    if (!playAction) {
                        console.error("Don't know how to play this project");
                        dispatch(
                            openSnackbar(
                                "No playable files found in this project. Please add a .csd or .orc file.",
                                SnackbarType.Error
                            )
                        );
                        setIsLoading(false);
                        return;
                    }

                    try {
                        switch (csoundPlayState) {
                            case "playing": {
                                dispatch(pauseCsound());
                                break;
                            }
                            case "paused": {
                                dispatch(resumePausedCsound());
                                break;
                            }
                            case "stopped":
                            case "error":
                            case "initialized": {
                                if (isOwner) {
                                    dispatch(saveAllFiles());
                                }
                                playAction &&
                                    (await (playAction as any)(
                                        dispatch,
                                        setConsole
                                    ));
                            }
                        }
                    } catch (error) {
                        console.error("Error playing project:", error);
                        dispatch(
                            openSnackbar(
                                "Error playing project.",
                                SnackbarType.Error
                            )
                        );
                    } finally {
                        setIsLoading(false);
                    }
                }}
            >
                {isLoading ? (
                    <TailSpinAny
                        css={SS.playButtonLoadingSpinner}
                        color={theme.buttonIcon}
                        height={25}
                        width={25}
                    />
                ) : (
                    <button
                        css={SS.playButtonStyle(
                            ["playing", "rendering"].includes(csoundPlayState)
                        )}
                    />
                )}
            </div>
        </Tooltip>
    );
};

export default PlayButton;
