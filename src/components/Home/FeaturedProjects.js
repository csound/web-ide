import React from "react";
import {
    FeaturedProjectsContainer,
    FeaturedProjectsRowContainer,
    ProjectSectionHeader,
    HorizontalRule,
    ProjectCardContainer
} from "./HomeUI";
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
            <ProjectSectionHeader row={row} duration={duration}>
                {heading}
                <HorizontalRule />
            </ProjectSectionHeader>

            <FeaturedProjectsRowContainer
                cellHeight={300}
                cols={projectColumnCount}
                row={row + 1}
            >
                {Array.isArray(projects) &&
                    projects.map((e, i) => {
                        return (
                            <ProjectCard
                                key={i}
                                event={e}
                                projectIndex={i}
                                duration={duration}
                                projectColumnCount={projectColumnCount}
                                project={e}
                                key={i}
                                profiles={profiles}
                            />
                        );
                    })}
            </FeaturedProjectsRowContainer>
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
