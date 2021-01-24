import React, { useEffect, useState } from "react";
import { playListItem } from "./actions";
import { selectCsoundStatus } from "@comp/csound/selectors";
import { pauseCsound, resumePausedCsound } from "@comp/csound/actions";
import {
    selectCurrentlyPlayingProject,
    selectProjectIconStyle
} from "./selectors";
import SVGPaths, { SVGComponents } from "./svg-paths";
import { useDispatch, useSelector } from "react-redux";
import AssignmentIcon from "@material-ui/icons/Assignment";
import AlertIcon from "@material-ui/icons/ErrorOutline";
import { useTheme } from "@emotion/react";
import * as SS from "./styles";
import { Avatar } from "@material-ui/core";

const SvgPlayIcon = () => {
    const theme = useTheme();
    return (
        <svg
            x={0}
            y={0}
            className={"listPlayIcon"}
            style={{
                width: "calc(100% - 24px)",
                height: "calc(100% - 24px)",
                position: "absolute",
                right: 12,
                fill: (theme as any).allowed
            }}
            enableBackground="new 0 0 58.752 58.752"
            viewBox="0 0 58.752 58.752"
            xmlSpace="preserve"
        >
            <path d="M52.524 23.925L12.507.824c-1.907-1.1-4.376-1.097-6.276 0a6.294 6.294 0 00-3.143 5.44v46.205a6.29 6.29 0 003.131 5.435 6.263 6.263 0 006.29.005l40.017-23.103a6.3 6.3 0 003.138-5.439 6.315 6.315 0 00-3.14-5.442zm-3 5.687L9.504 52.716a.27.27 0 01-.279-.005.28.28 0 01-.137-.242V6.263a.28.28 0 01.421-.243l40.01 23.098a.29.29 0 01.145.249.283.283 0 01-.14.245z"></path>
        </svg>
    );
};

const ListPlayButton = ({
    projectUid,
    iconNameProp,
    iconBackgroundColorProp,
    iconForegroundColorProp
}: {
    projectUid: string;
    iconNameProp: string | undefined;
    iconBackgroundColorProp: string | undefined;
    iconForegroundColorProp: string | undefined;
}): React.ReactElement => {
    const theme: any = useTheme();
    const currentlyPlayingProject = useSelector(selectCurrentlyPlayingProject);
    const csoundStatus = useSelector(selectCsoundStatus);
    const { iconName, iconBackgroundColor, iconForegroundColor } = useSelector(
        selectProjectIconStyle(projectUid)
    );

    iconNameProp = !iconNameProp ? iconName : iconNameProp;
    iconBackgroundColorProp = !iconBackgroundColorProp
        ? iconBackgroundColor
        : iconBackgroundColorProp;
    iconForegroundColorProp = !iconForegroundColorProp
        ? iconForegroundColor
        : iconForegroundColorProp;
    const isPlaying = currentlyPlayingProject === projectUid;
    const hasError = isPlaying && csoundStatus === "error";
    const isPaused = isPlaying && csoundStatus === "paused";
    const [isStartingUp, setIsStartingUp] = useState(false);
    const dispatch = useDispatch();

    const IconComponent =
        iconNameProp && iconNameProp !== "default" && SVGPaths[iconNameProp]
            ? SVGComponents[`${iconNameProp}Component`]
            : AssignmentIcon;

    useEffect(() => {
        if (
            (isPlaying && isStartingUp && csoundStatus === "playing") ||
            (isPlaying && isStartingUp && csoundStatus === "error")
        ) {
            setIsStartingUp(false);
        }
    }, [isPlaying, csoundStatus, currentlyPlayingProject, isStartingUp]);

    return (
        <Avatar
            css={
                (isPlaying && !hasError && !isStartingUp) || isPaused
                    ? [SS.avatar, SS.showAvatarPlayButton]
                    : SS.avatar
            }
            style={{
                backgroundColor: hasError
                    ? theme.errorText
                    : isPlaying || isStartingUp
                    ? "black"
                    : iconBackgroundColorProp
            }}
            onClick={(event) => {
                !isPlaying && !isStartingUp && setIsStartingUp(true);
                isPaused
                    ? dispatch(resumePausedCsound())
                    : isPlaying && !hasError
                    ? dispatch(pauseCsound())
                    : dispatch(playListItem(projectUid));

                event.stopPropagation();
            }}
        >
            <>
                {!isPlaying && !isStartingUp && (
                    <IconComponent
                        className={"projectIcon"}
                        css={SS.avatarIcon(iconForegroundColorProp || "")}
                        style={{
                            fill: `${iconForegroundColorProp}!important`
                        }}
                    />
                )}
                {(isPaused || !isPlaying || hasError) && !isStartingUp && (
                    <SvgPlayIcon />
                )}
                {hasError && (
                    <AlertIcon
                        className={"projectIcon"}
                        style={{
                            fill: "white",
                            fontSize: 40
                        }}
                        fontSize="large"
                        color="error"
                    />
                )}
                {isStartingUp && (
                    <span css={SS.loadingSpinner}>
                        <span />
                        <span />
                    </span>
                )}
                {isPlaying && !hasError && !isPaused && (
                    <span css={SS.pauseIcon} />
                )}
            </>
        </Avatar>
    );
};

export default ListPlayButton;
