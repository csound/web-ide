import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
import withStyles from "./styles";
import { makeStyles } from "@material-ui/styles";
import { red } from "@material-ui/core/colors";
import { SVGComponents } from "../Profile/SVGPaths";
import { Transition, TransitionGroup } from "react-transition-group";
import { Wave } from "better-react-spinkit";
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
    ProjectCardContentBottomID,
    ProjectCardSpinnerContainer
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
        fontSize: "4em"
    }
}));

const ProjectCard = props => {
    const classes = useStyles();
    const {
        duration,
        projectIndex,
        projectColumnCount,
        transitionStatus,
        profiles,
        project
    } = props;
    let description = "",
        iconName = "",
        iconBackgroundColor = "",
        iconForegroundColor = "",
        name = "",
        userUid = "",
        photoUrl = "",
        displayName = "",
        bio = "";

    if (props.project !== null || typeof profiles[userUid] !== "undefined") {
        description = project.description;
        iconName = project.iconName;
        iconBackgroundColor = project.iconBackgroundColor;
        iconForegroundColor = project.iconForegroundColor;
        name = project.name;
        userUid = project.userUid;
        photoUrl = profiles[userUid].photoUrl;
        displayName = profiles[userUid].displayName;
        bio = profiles[userUid].bio;
    }

    // const listPlayState = "paused";
    // const currentlyPlayingProject = id;

    const [mouseOver, setMouseOver] = useState(false);

    iconName =
        iconName === "" ||
        typeof iconName === "undefined" ||
        iconName === "default"
            ? "fadwaveform"
            : iconName;

    const SVGIcon = SVGComponents[`${iconName}Component`];

    return (
        <ProjectCardContainer
            duration={duration}
            projectIndex={projectIndex}
            projectColumnCount={projectColumnCount}
            className={transitionStatus}
        >
            <TransitionGroup component={null}>
                {project === null && (
                    <Transition appear timeout={duration}>
                        {transitionStatus => {
                            return (
                                <ProjectCardSpinnerContainer
                                    className={transitionStatus}
                                    duration={duration}
                                >
                                    <Wave size={100} color={"white"} />
                                </ProjectCardSpinnerContainer>
                            );
                        }}
                    </Transition>
                )}
                {project !== null && (
                    <Transition appear timeout={duration}>
                        {transitionStatus => {
                            return (
                                <>
                                    <ProjectCardSVGContainer
                                        mouseOver={mouseOver}
                                        backgroundColor={iconBackgroundColor}
                                        className={transitionStatus}
                                        duration={duration}
                                    >
                                        <SVGIcon
                                            height="100%"
                                            width="100%"
                                            fill={iconForegroundColor}
                                        />
                                    </ProjectCardSVGContainer>
                                    <ProjectCardContentContainer
                                        className={transitionStatus}
                                        duration={duration}
                                        onMouseOver={() => {
                                            setMouseOver(true);
                                        }}
                                        onMouseLeave={() => setMouseOver(false)}
                                    >
                                        <ProjectCardContentTop>
                                            <ProjectCardContentTopHeader>
                                                {name}
                                            </ProjectCardContentTopHeader>
                                            <ProjectCardContentTopDescription>
                                                {description}
                                            </ProjectCardContentTopDescription>
                                        </ProjectCardContentTop>
                                        <ProjectCardContentMiddle>
                                            <StyledIconButton
                                                size="small"
                                                className={classes.largeButton}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    // dispatch(playListItem(projectUid));
                                                }}
                                            >
                                                <PlayIcon
                                                    fontSize="large"
                                                    className={
                                                        classes.largeIcon
                                                    }
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
                                </>
                            );
                        }}
                    </Transition>
                )}
            </TransitionGroup>
        </ProjectCardContainer>
    );
};

export default withStyles(ProjectCard);
