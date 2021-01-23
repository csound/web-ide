import React, { useState } from "react";
import withStyles from "./styles";
import { SVGComponents } from "../profile/svg-paths";
import { Transition, TransitionGroup } from "react-transition-group";
import { ThreeBounce } from "better-react-spinkit";
import { get } from "lodash";
import { path } from "ramda";
import ListPlayButton from "../profile/list-play-button";
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
} from "./home-ui";

const ProjectCard = (properties) => {
    const {
        duration,
        projectIndex,
        projectColumnCount,
        transitionStatus,
        profiles,
        project
    } = properties;
    let photoUrl = "",
        displayName = "",
        username = "",
        bio = "";

    const {
        description = "",
        iconName: iconName_ = "",
        iconBackgroundColor = "",
        iconForegroundColor = "",
        name = "",
        userUid = "",
        id: projectId
    } = project;

    if (project || typeof profiles[userUid] !== "undefined") {
        photoUrl = path([userUid, "photoUrl"], profiles);
        displayName = path([userUid, "displayName"], profiles);
        username = get(profiles, `${userUid}.username`) || "";
        bio = get(profiles, `${userUid}.bio`) || "";
    }

    const [mouseOver, setMouseOver] = useState(false);

    const iconName =
        iconName_ === "" ||
        typeof iconName_ === "undefined" ||
        iconName_ === "default"
            ? "fadwaveform"
            : iconName_;

    const SVGIcon = SVGComponents[`${iconName}Component`];

    return (
        <ProjectCardContainer
            duration={duration}
            projectIndex={projectIndex}
            projectColumnCount={projectColumnCount}
            className={transitionStatus}
        >
            {/* eslint-disable-next-line  unicorn/no-null */}
            <TransitionGroup component={null}>
                {!project && (
                    <Transition appear timeout={duration}>
                        {(transitionStatus) => {
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
                {project && (
                    <Transition appear timeout={duration}>
                        {(transitionStatus) => {
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
                                            to={`editor/${projectId}`}
                                        >
                                            <ProjectCardContentTopHeader>
                                                {name}
                                            </ProjectCardContentTopHeader>
                                            <ProjectCardContentTopDescription>
                                                {description}
                                            </ProjectCardContentTopDescription>
                                        </ProjectCardContentTop>
                                        <span
                                            style={{
                                                position: "absolute",
                                                margin: "0 auto",
                                                top: "calc(50% - 32px)",
                                                left: "calc(50% - 32px)",
                                                zIndex: 2
                                            }}
                                        >
                                            <ListPlayButton
                                                projectUid={projectId}
                                                iconNameProp={iconName}
                                                iconBackgroundColorProp={
                                                    iconBackgroundColor
                                                }
                                                iconForegroundColorProp={
                                                    iconForegroundColor
                                                }
                                            />
                                        </span>
                                        <ProjectCardContentMiddle />
                                        <ProjectCardContentBottom
                                            to={`profile/${username}`}
                                        >
                                            <ProjectCardContentBottomPhoto>
                                                {photoUrl && (
                                                    <Photo src={photoUrl} />
                                                )}
                                            </ProjectCardContentBottomPhoto>
                                            <ProjectCardContentBottomID>
                                                <ProjectCardContentBottomHeader>
                                                    {displayName || username}
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
