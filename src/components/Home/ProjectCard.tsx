import React, { useState } from "react";
import withStyles from "./styles";
import { SVGComponents } from "../Profile/SVGPaths";
import { Transition, TransitionGroup } from "react-transition-group";
import { ThreeBounce } from "better-react-spinkit";
import { get } from "lodash";
import { pathOr } from "ramda";
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
        photoUrl = pathOr(null, [userUid, "photoUrl"], profiles);
        displayName = pathOr(null, [userUid, "displayName"], profiles);
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
                                            to={`editor/${project.id}`}
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
                                                projectUid={project.id}
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
