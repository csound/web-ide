import React from "react";
import {
    FeaturedProjectsRowContainer,
    ProjectSectionHeader,
    ProjectSectionCardContainer,
    HorizontalRule,
    FeaturedProjectContainer
} from "./HomeUI";
import { Transition, TransitionGroup } from "react-transition-group";
import ProjectCard from "./ProjectCard";
import { GridList, GridListTile } from "@material-ui/core";

const FeaturedProjectsRow = ({
    row,
    projectColumnCount,
    heading,
    duration,
    projects
}) => {
    return (
        <FeaturedProjectsRowContainer row={row}>
            <TransitionGroup component={null}>
                {projectColumnCount !== 0 && (
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
                )}
            </TransitionGroup>
            <ProjectSectionCardContainer row={2}>
                <TransitionGroup component={null}>
                    <GridList cellHeight={300} cols={4}>
                        {Array.isArray(projects) &&
                            projects.map((e, i) => {
                                return (
                                    <Transition
                                        key={i}
                                        appear
                                        timeout={duration}
                                    >
                                        {transitionStatus => {
                                            return (
                                                <GridListTile key={i}>
                                                    <ProjectCard
                                                        event={e}
                                                        projectIndex={i}
                                                        duration={duration}
                                                        className={
                                                            transitionStatus
                                                        }
                                                        projectColumnCount={
                                                            projectColumnCount
                                                        }
                                                        project={e}
                                                    />
                                                </GridListTile>
                                            );
                                        }}
                                    </Transition>
                                );
                            })}
                    </GridList>
                </TransitionGroup>
            </ProjectSectionCardContainer>
        </FeaturedProjectsRowContainer>
    );
};

export default ({
    projectColumnCount,
    transitionStatus,
    duration,
    starredProjects
}) => {
    return (
        <FeaturedProjectContainer
            className={transitionStatus}
            duration={duration}
        >
            <FeaturedProjectsRow
                row={1}
                projectColumnCount={projectColumnCount}
                heading={"Popular Projects"}
                duration={duration}
                projects={starredProjects}
            />
            <FeaturedProjectsRow
                row={2}
                projectColumnCount={projectColumnCount}
                heading={"More Projects"}
                duration={duration}
                projects={starredProjects}
            />
        </FeaturedProjectContainer>
    );
};
