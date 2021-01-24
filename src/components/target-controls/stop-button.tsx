import React from "react";
import * as SS from "./styles";
import Tooltip from "@material-ui/core/Tooltip";
import { useSelector, useDispatch } from "react-redux";
import { IStore } from "@store/types";
import { pathOr } from "ramda";
import { stopCsound } from "@comp/csound/actions";
import { IconButton } from "@material-ui/core";
import StopIcon from "@material-ui/icons/Stop";

const StopButton = ({
    activeProjectUid,
    isOwner
}: {
    activeProjectUid: string;
    isOwner: boolean;
}): React.ReactElement => {
    const csoundPlayState: string = useSelector((store: IStore) => {
        return pathOr("stopped", ["csound", "status"], store);
    });

    const dispatch = useDispatch();

    const tooltipText = "stop playback";

    return (
        <Tooltip title={tooltipText}>
            <div css={SS.buttonContainer}>
                <IconButton
                    css={SS.iconButton}
                    size="medium"
                    onClick={() => {
                        switch (csoundPlayState) {
                            case "playing":
                            case "paused": {
                                dispatch(stopCsound());
                                break;
                            }
                        }
                    }}
                    disabled={
                        csoundPlayState === "stopped" ||
                        csoundPlayState === "error"
                    }
                >
                    <StopIcon css={SS.stopIcon} fontSize="large" />
                </IconButton>
            </div>
        </Tooltip>
    );
};

export default StopButton;
