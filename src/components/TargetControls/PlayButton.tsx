import React from "react";
import * as SS from "./styles";
import { useSelector, useDispatch } from "react-redux";
import { IStore } from "@store/types";
import { pathOr } from "ramda";
import { getPlayActionFromTarget } from "./utils";
import { stopCsound } from "@comp/Csound/actions";

const PlayButton = () => {
    const playAction = useSelector(getPlayActionFromTarget);

    const csoundPlayState: string = useSelector((store: IStore) => {
        return pathOr("stopped", ["csound", "status"], store);
    });

    const dispatch = useDispatch();

    if (playAction) {
        return (
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
        );
    } else {
        return <></>;
    }
};

export default PlayButton;
