import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@emotion/react";
import { RootState } from "@root/store";
import DisabledByDefaultRoundedIcon from "@mui/icons-material/DisabledByDefaultRounded";
import { windowHeader as windowHeaderStyle } from "@styles/_common";
import Tooltip from "@mui/material/Tooltip";
import IframeComm from "react-iframe-comm";
import { setManualPanelOpen } from "./actions";
import { IProjectEditorReducer } from "./reducer";
import * as SS from "./styles";

const ManualWindow = ({
    projectUid,
    isDragging = false,
    showHeader = true
}: {
    projectUid: string;
    isDragging?: boolean;
    showHeader?: boolean;
}): React.ReactElement => {
    const dispatch = useDispatch();
    const theme: any = useTheme();

    const manualLookupString = useSelector(
        (store: RootState) =>
            (store.ProjectEditorReducer as IProjectEditorReducer)
                .manualLookupString
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
                minHeight: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                pointerEvents: isDragging ? "none" : "auto"
            }}
        >
            {showHeader && (
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
                                    <DisabledByDefaultRoundedIcon
                                        style={{
                                            fill: theme.highlightBackgroundAlt
                                        }}
                                    />
                                </span>
                            </Tooltip>
                        </span>
                    </p>
                </div>
            )}
            <div
                style={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    width: "100%",
                    height: showHeader ? "calc(100% - 35px)" : "100%"
                }}
            >
                <IframeComm
                    attributes={{
                        src: "/manual?cache=1002",
                        width: "100%",
                        height: "100%"
                    }}
                    postMessageData={manualLookupString || ""}
                />
            </div>
        </div>
    );
};

export default ManualWindow;
