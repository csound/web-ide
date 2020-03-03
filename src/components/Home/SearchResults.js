import React from "react";
import {
    SearchProjectContainer,
    ProjectSectionHeader,
    ProjectSectionCardContainer,
    HorizontalRule
} from "./HomeUI";
import { Transition, TransitionGroup } from "react-transition-group";
import ProjectCard from "./ProjectCard";

export default ({
    projectColumnCount,
    heading,
    transitionStatus,
    duration
}) => {
    return (
        <TransitionGroup
            component={SearchProjectContainer}
            className={transitionStatus}
            duration={duration}
        >
            <Transition appear timeout={duration}>
                {transitionStatus => {
                    return (
                        <ProjectSectionHeader
                            className={transitionStatus}
                            row={1}
                            duration={duration}
                        >
                            {heading}
                            <HorizontalRule />
                        </ProjectSectionHeader>
                    );
                }}
            </Transition>
        </TransitionGroup>
    );
};
