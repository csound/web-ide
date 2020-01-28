import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
import withStyles from "./styles";
import { makeStyles } from "@material-ui/styles";
import { red } from "@material-ui/core/colors";
import { SVGComponents } from "../Profile/SVGPaths";

import {
    ProjectCardContainer,
    ProjectCardSVGContainer,
    ProjectCardContentContainer,
    ProjectCardContentTop,
    ProjectCardContentBottom,
    ProjectCardContentTopHeader,
    ProjectCardContentTopDescription,
    ProjectCardContentMiddle,
    ProjectCardContentBottomPhoto,
    ProjectCardContentBottomHeader,
    ProjectCardContentBottomDescription,
    StyledIconButton,
    Photo,
    ProjectCardContentBottomID
} from "./HomeUI";
import PlayIcon from "@material-ui/icons/PlayCircleFilledRounded";
// import PauseIcon from "@material-ui/icons/PauseCircleFilledRounded";

const useStyles = makeStyles(theme => ({
    card: {
        maxWidth: 360,
        padding: 10,
        height: 360
    },
    media: {
        height: 100
    },
    avatar: {
        backgroundColor: red[500]
    },
    largeButton: {},
    largeIcon: {
        fontSize: "5em"
    }
}));

const ProjectCard = props => {
    const classes = useStyles();
    // console.log(props.profile, props.project);

    let {
        description,
        iconName,
        iconBackgroundColor,
        iconForegroundColor,
        name
        // id
    } = props.project;

    const { photoUrl, displayName, bio } = props.profile;

    // const listPlayState = "paused";
    // const currentlyPlayingProject = id;

    const [mouseOver, setMouseOver] = useState(false);

    iconName =
        iconName === "" || typeof iconName === "undefined"
            ? "fadwaveform"
            : iconName;

    const SVGIcon = SVGComponents[`${iconName}Component`];
    return (
        <ProjectCardContainer
            onMouseOver={() => {
                setMouseOver(true);
            }}
            onMouseLeave={() => setMouseOver(false)}
        >
            <ProjectCardSVGContainer
                mouseOver={mouseOver}
                backgroundColor={iconBackgroundColor}
            >
                <SVGIcon
                    height="100%"
                    width="100%"
                    fill={iconForegroundColor}
                />
            </ProjectCardSVGContainer>
            <ProjectCardContentContainer>
                <ProjectCardContentTop>
                    <ProjectCardContentTopHeader>
                        {name}
                    </ProjectCardContentTopHeader>
                    <ProjectCardContentTopDescription>
                        {description}
                    </ProjectCardContentTopDescription>
                </ProjectCardContentTop>
                <ProjectCardContentMiddle>
                    {/* {(listPlayState === "playing" &&
                        id === currentlyPlayingProject && (
                            <IconButton
                                size="medium"
                                aria-label="Delete"
                                onClick={e => {
                                    e.stopPropagation();
                                    dispatch(pauseListItem(projectUid));
                                }}
                            >
                                <PauseIcon
                                    fontSize="large"
                                    style={{
                                        color: theme.profilePlayButton.secondary
                                    }}
                                />
                            </IconButton>
                        )) || ( */}
                    <StyledIconButton
                        size="medium"
                        className={classes.largeButton}
                        onClick={e => {
                            e.stopPropagation();
                            // dispatch(playListItem(projectUid));
                        }}
                    >
                        <PlayIcon
                            fontSize="large"
                            className={classes.largeIcon}
                            style={
                                {
                                    // color: theme.profilePlayButton.primary
                                }
                            }
                        />
                    </StyledIconButton>
                </ProjectCardContentMiddle>
                <ProjectCardContentBottom>
                    <ProjectCardContentBottomPhoto>
                        <Photo src={photoUrl} />
                    </ProjectCardContentBottomPhoto>
                    <ProjectCardContentBottomID>
                        <ProjectCardContentBottomHeader>
                            {displayName}
                        </ProjectCardContentBottomHeader>
                        <ProjectCardContentBottomDescription>
                            {bio}
                        </ProjectCardContentBottomDescription>
                    </ProjectCardContentBottomID>
                </ProjectCardContentBottom>
            </ProjectCardContentContainer>
        </ProjectCardContainer>
    );
};

export default withStyles(ProjectCard);
