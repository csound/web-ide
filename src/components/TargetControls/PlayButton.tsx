import React from "react";
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
import { pauseCsound, resumePausedCsound } from "@comp/Csound/actions";
import { saveAllFiles } from "@comp/Projects/actions";

const PlayButton = ({ activeProjectUid, isOwner }) => {
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
        <Tooltip title={tooltipText}>
            <div
                css={SS.playButtonContainer}
                onClick={() => {
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
                        case "initialized": {
                            dispatch(playAction);
                            isOwner && dispatch(saveAllFiles());
                        }
                    }
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
