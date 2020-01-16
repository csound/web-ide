import React from "react";
import * as SS from "./styles";
import Tooltip from "@material-ui/core/Tooltip";
import { useSelector, useDispatch } from "react-redux";
import { IStore } from "@store/types";
import { pathOr } from "ramda";
import { getPlayActionFromTarget } from "./utils";
import { selectSelectedTarget } from "./selectors";
import { stopCsound } from "@comp/Csound/actions";

const PlayButton = () => {
    const playAction = useSelector(getPlayActionFromTarget);

    const csoundPlayState: string = useSelector((store: IStore) => {
        return pathOr("stopped", ["csound", "status"], store);
    });

    const selectedTargetName: string | null = useSelector(selectSelectedTarget);

    const dispatch = useDispatch();

    if (playAction) {
        return (
            <Tooltip
                title={
                    csoundPlayState === "playing"
                        ? "pause playback"
                        : `run ${selectedTargetName}`
                }
            >
                <div
                    css={SS.playButtonContainer}
                    onClick={e =>
                        csoundPlayState === "playing"
                            ? dispatch(stopCsound())
                            : dispatch(playAction)
                    }
                >
                    <button
                        css={SS.playButtonStyle(csoundPlayState === "playing")}
                    />
                </div>
            </Tooltip>
        );
    } else {
        return <></>;
    }
};

export default PlayButton;
