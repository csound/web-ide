import React from "react";
import {
    FeaturedProjectsContainer,
    FeaturedProjectsRowContainer,
    ProjectSectionHeader,
    HorizontalRule,
    ProjectCardContainer
} from "./HomeUI";
import { Transition, TransitionGroup } from "react-transition-group";
import ProjectCard from "./ProjectCard";

const FeaturedProjectsRow = ({
    projectColumnCount,
    projects,
    profiles,
    duration,
    heading,
    row
}) => {
    return (
        <>
            <TransitionGroup component={null}>
                {projectColumnCount !== 0 && (
                    <Transition appear timeout={duration}>
                        {transitionStatus => {
                            return (
                                <ProjectSectionHeader
                                    className={transitionStatus}
                                    row={row}
                                    duration={duration}
                                >
                                    {heading}
                                    <HorizontalRule />
                                </ProjectSectionHeader>
                            );
                        }}
                    </Transition>
                )}
            </TransitionGroup>
            <TransitionGroup
                component={FeaturedProjectsRowContainer}
                cellHeight={300}
                cols={projectColumnCount}
                row={row + 1}
            >
                {Array.isArray(projects) &&
                    projects.map((e, i) => {
                        return (
                            <Transition key={i} appear timeout={duration}>
                                {transitionStatus => {
                                    return (
                                        <ProjectCard
                                            event={e}
                                            projectIndex={i}
                                            duration={duration}
                                            transitionStatus={transitionStatus}
                                            projectColumnCount={
                                                projectColumnCount
                                            }
                                            project={e}
                                            key={i}
                                            profiles={profiles}
                                        />
                                    );
                                }}
                            </Transition>
                        );
                    })}
            </TransitionGroup>
        </>
    );
};
const FeaturedProjects = ({
    projectColumnCount,
    starredProjects,
    duration,
    profiles,
    transitionStatus
}) => {
    return (
        <FeaturedProjectsContainer
            className={transitionStatus}
            duration={duration}
        >
            <FeaturedProjectsRow
                projectColumnCount={projectColumnCount}
                projects={starredProjects}
                profiles={profiles}
                duration={duration}
                heading={"Popular Projects"}
                row={1}
            />
            <FeaturedProjectsRow
                projectColumnCount={projectColumnCount}
                projects={starredProjects}
                profiles={profiles}
                duration={duration}
                heading={"Popular Projects"}
                row={3}
            />
        </FeaturedProjectsContainer>
    );
};
export default FeaturedProjects;
