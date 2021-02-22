import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@emotion/react";
import { IStore } from "@store/types";
import { windowHeader as windowHeaderStyle } from "@styles/_common";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWindowClose } from "@fortawesome/free-solid-svg-icons";
import Tooltip from "@material-ui/core/Tooltip";
import IframeComm from "react-iframe-comm";
import { setManualPanelOpen } from "./actions";
import * as SS from "./styles";

const ManualWindow = ({
    projectUid,
    isDragging = false
}: {
    projectUid: string;
    isDragging?: boolean;
}): React.ReactElement => {
    const dispatch = useDispatch();
    const theme: any = useTheme();

    const manualLookupString = useSelector(
        (store: IStore) => store.ProjectEditorReducer.manualLookupString
    );

    // const onManualMessage = (event_) => {
    //     console.log("ON MAN MSG", event_, theme);
    // };

    useEffect(() => {
        sessionStorage.setItem(projectUid + ":manualVisible", "true");
        return () =>
            sessionStorage.setItem(projectUid + ":manualVisible", `false`);
    }, [projectUid]);

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                paddingTop: 35,
                pointerEvents: isDragging ? "none" : "auto"
            }}
        >
            <IframeComm
                attributes={{
                    src: "/manual/main?cache=1002",
                    width: "100%",
                    height: "100%"
                }}
                postMessageData={manualLookupString || ""}
            />
            <div css={windowHeaderStyle}>
                <p>
                    Csound Manual
                    <span css={SS.headIconsContainer}>
                        <Tooltip title="close window">
                            <span
                                onClick={() =>
                                    dispatch(setManualPanelOpen(false))
                                }
                            >
                                <FontAwesomeIcon
                                    icon={faWindowClose}
                                    size="sm"
                                    color={theme.highlightBackgroundAlt}
                                />
                            </span>
                        </Tooltip>
                    </span>
                </p>
            </div>
        </div>
    );
};

export default ManualWindow;
