import React, { useState } from "react";
import * as SS from "./styles";
import Tooltip from "@material-ui/core/Tooltip";
import { useSelector, useDispatch } from "react-redux";
import { IStore } from "@store/types";
import { path, pathOr } from "ramda";
import {
    getDefaultTargetDocument,
    getPlayActionFromProject,
    getPlayActionFromTarget
} from "./utils";
import { selectSelectedTarget } from "./selectors";
import {
    fetchSetStartCsound,
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
    const playActionDefault = useSelector(getPlayActionFromTarget);

    const playActionFallback = useSelector(
        getPlayActionFromProject(activeProjectUid)
    );

    const csoundPlayState: string = useSelector((store: IStore) => {
        return pathOr("stopped", ["csound", "status"], store);
    });

    const csoundConstructorReady: boolean = useSelector((store: IStore) => {
        return typeof path(["csound", "factory"], store) === "function";
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
        <Tooltip title={tooltipText}>
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
                            if (!csoundConstructorReady) {
                                await fetchSetStartCsound(
                                    playAction as any,
                                    activeProjectUid
                                )(dispatch);
                            } else {
                                playAction &&
                                    (await (playAction as any)(dispatch));
                            }
                        }
                    }
                    setIsLoading(false);
                }}
            >
                <button
                    css={SS.playButtonStyle(csoundPlayState === "playing")}
                />
            </div>
        </Tooltip>
    );
};

export default PlayButton;
