import React from "react";
import { selectProjectIconStyle } from "./selectors";
import SVGPaths, { SVGComponents } from "./SVGPaths";
import { useSelector } from "react-redux";
import AssignmentIcon from "@material-ui/icons/Assignment";
import { useTheme } from "emotion-theming";
import * as SS from "./styles";
import { Avatar } from "@material-ui/core";

/*
                <IconButton
                    size="medium"
                    aria-label="Delete"
                    onClick={e => {
                        e.stopPropagation();
                        dispatch(
                            isCurrentlyPlaying
                                ? pauseListItem(projectUid)
                                : playListItem(projectUid)
                        );
                    }}
                >
                    {isCurrentlyPlaying ? (
                        <PauseIcon
                            fontSize="large"
                            style={{
                                color: theme.profilePlayButtonActive
                            }}
                        />
                    ) : (
                        <PlayIcon
                            fontSize="large"
                            style={{
                                color: theme.profilePlayButton
                            }}
                        />
                    )}
                </IconButton>
*/

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
                marginRight: -26,
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

const ListPlayButton = ({ projectUid }) => {
    const { iconName, iconBackgroundColor } = useSelector(
        selectProjectIconStyle(projectUid)
    );
    let IconComponent;
    if (iconName && iconName !== "default" && SVGPaths[iconName]) {
        IconComponent = SVGComponents[`${iconName}Component`];
    } else {
        IconComponent = AssignmentIcon;
    }

    return (
        <Avatar
            css={SS.avatar}
            style={{ backgroundColor: iconBackgroundColor }}
        >
            <IconComponent className={"projectIcon"} css={SS.avatarIcon} />
            <SvgPlayIcon />
        </Avatar>
    );
};

export default ListPlayButton;
