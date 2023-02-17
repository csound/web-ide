import React from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import Tooltip from "@mui/material/Tooltip";
import { pathOr } from "ramda";
import { stopCsound } from "@comp/csound/actions";
import { IconButton } from "@mui/material";
import StopIcon from "@mui/icons-material/Stop";
import * as SS from "./styles";

const StopButton = (): React.ReactElement => {
    const csoundPlayState: string = useSelector((store: RootState) => {
        return pathOr("stopped", ["csound", "status"], store);
    });

    const dispatch = useDispatch();

    const tooltipText =
        csoundPlayState === "rendering" ? "stop render" : "stop playback";

    return (
        <Tooltip title={tooltipText}>
            <div css={SS.buttonContainer}>
                <IconButton
                    css={SS.iconButton}
                    size="medium"
                    onClick={() => {
                        switch (csoundPlayState) {
                            case "playing":
                            case "rendering":
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
