import React, { useState } from "react";
import withStyles from "./styles";
import { SVGComponents } from "../Profile/SVGPaths";
import { Transition, TransitionGroup } from "react-transition-group";
import { ThreeBounce } from "better-react-spinkit";
import { get } from "lodash";
import ListPlayButton from "../Profile/ListPlayButton";
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
    Photo,
    ProjectCardContentBottomID,
    ProjectCardSpinnerContainer
} from "./HomeUI";
import { push } from "connected-react-router";
import { useDispatch } from "react-redux";

const ProjectCard = props => {
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
        username = "",
        bio = "";

    if (props.project !== null || typeof profiles[userUid] !== "undefined") {
        description = project.description;
        iconName = project.iconName;
        iconBackgroundColor = project.iconBackgroundColor;
        iconForegroundColor = project.iconForegroundColor;
        name = project.name;
        userUid = project.userUid;
        photoUrl = get(profiles, `${userUid}.photoUrl`) || "";
        displayName = get(profiles, `${userUid}.displayName`) || "";
        username = get(profiles, `${userUid}.username`) || "";
        bio = get(profiles, `${userUid}.bio`) || "";
    }

    const [mouseOver, setMouseOver] = useState(false);

    iconName =
        iconName === "" ||
        typeof iconName === "undefined" ||
        iconName === "default"
            ? "fadwaveform"
            : iconName;

    const SVGIcon = SVGComponents[`${iconName}Component`];
    const dispatch = useDispatch();
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
                                    <ThreeBounce size={20} color={"white"} />
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
                                        <ProjectCardContentTop
                                            onClick={() => {
                                                dispatch(
                                                    push(`editor/${project.id}`)
                                                );
                                            }}
                                        >
                                            <ProjectCardContentTopHeader>
                                                {name}
                                            </ProjectCardContentTopHeader>
                                            <ProjectCardContentTopDescription>
                                                {description}
                                            </ProjectCardContentTopDescription>
                                        </ProjectCardContentTop>
                                        <ProjectCardContentMiddle
                                            onClick={() => {
                                                dispatch(
                                                    push(`editor/${project.id}`)
                                                );
                                            }}
                                        >
                                            <ListPlayButton
                                                projectUid={project.id}
                                                iconNameProp={iconName}
                                                iconBackgroundColorProp={
                                                    iconBackgroundColor
                                                }
                                                iconForegroundColorProp={
                                                    iconForegroundColor
                                                }
                                            />
                                        </ProjectCardContentMiddle>
                                        <ProjectCardContentBottom
                                            onClick={() => {
                                                dispatch(
                                                    push(`profile/${username}`)
                                                );
                                            }}
                                        >
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
