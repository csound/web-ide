import React, { useState } from "react";
import { useTheme } from "@emotion/react";
import Loader from "react-loader-spinner";
import * as SS from "./styles";
import Tooltip from "@material-ui/core/Tooltip";
import { useSelector, useDispatch } from "react-redux";
import { IStore } from "@store/types";
import { pathOr } from "ramda";
import {
    getDefaultTargetDocument,
    getPlayActionFromProject,
    getPlayActionFromTarget
} from "./utils";
import { selectSelectedTarget } from "./selectors";
import {
    // fetchSetStartCsound,
    pauseCsound,
    resumePausedCsound
} from "@comp/csound/actions";
import { saveAllFiles } from "@comp/projects/actions";

const PlayButton = ({
    activeProjectUid,
    isOwner
}: {
    activeProjectUid: string;
    isOwner: boolean;
}): React.ReactElement => {
    const [isLoading, setIsLoading] = useState(false);

    const theme = useTheme();

    const playActionDefault = useSelector(getPlayActionFromTarget);

    const playActionFallback = useSelector(
        getPlayActionFromProject(activeProjectUid)
    );

    const csoundPlayState: string = useSelector((store: IStore) => {
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

    return (
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
                            playAction && (await (playAction as any)(dispatch));
                        }
                    }
                    setIsLoading(false);
                }}
            >
                {isLoading ? (
                    <Loader
                        css={SS.playButtonLoadingSpinner}
                        type="TailSpin"
                        color={theme.buttonIcon}
                        height={25}
                        width={25}
                    />
                ) : (
                    <button
                        css={SS.playButtonStyle(csoundPlayState === "playing")}
                    />
                )}
            </div>
        </Tooltip>
    );
};

export default PlayButton;
