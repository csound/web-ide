import React, { useState } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { useTheme } from "@emotion/react";
import { TailSpin } from "react-loader-spinner";
import * as SS from "./styles";
import Tooltip from "@mui/material/Tooltip";
import { pathOr } from "ramda";
import {
    getDefaultTargetDocument,
    getPlayActionFromProject,
    getPlayActionFromTarget
} from "./utils";
import { selectSelectedTarget } from "./selectors";
import { useSetConsole } from "@comp/console/context";
import { pauseCsound, resumePausedCsound } from "@comp/csound/actions";
import { saveAllFiles } from "@comp/projects/actions";

const TailSpinAny = TailSpin as any;

const PlayButton = ({
    activeProjectUid,
    isOwner
}: {
    activeProjectUid: string;
    isOwner: boolean;
}): React.ReactElement => {
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
        return pathOr("stopped", ["csound", "status"], store);
    });

    const selectedTargetName: string | null = useSelector(
        selectSelectedTarget(activeProjectUid)
    );

    const fallbackTargetDocument: any = useSelector(
        getDefaultTargetDocument(activeProjectUid)
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
                        return;
                    }
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
                    setIsLoading(false);
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
