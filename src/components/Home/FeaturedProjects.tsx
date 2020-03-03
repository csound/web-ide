import React from "react";
import {
    AnimatedGridContainer,
    ProjectSectionHeader,
    HorizontalRule
} from "./HomeUI";
import { Grid } from "@material-ui/core";
import ProjectCard from "./ProjectCard";
const FeaturedProjects = ({
    duration,
    starredProjects,
    featuredProjectUserProfiles,
    randomProjects,
    transitionState
}) => {
    return (
        <AnimatedGridContainer
            duration={duration}
            container
            spacing={3}
            className={transitionState}
        >
            <Grid item xs={12}>
                <ProjectSectionHeader>
                    Popular Projects
                    <HorizontalRule />
                </ProjectSectionHeader>
            </Grid>

            {Array.isArray(starredProjects) &&
                starredProjects.map((e, i) => {
                    return (
                        <Grid item xs={6} sm={3} key={i}>
                            <ProjectCard
                                event={e}
                                projectIndex={i}
                                duration={duration}
                                project={e}
                                profiles={featuredProjectUserProfiles}
                            />
                        </Grid>
                    );
                })}

            <Grid item xs={12}>
                <ProjectSectionHeader>
                    Other Projects
                    <HorizontalRule />
                </ProjectSectionHeader>
            </Grid>
            {Array.isArray(randomProjects) &&
                randomProjects.map((e, i) => {
                    return (
                        <Grid item xs={6} sm={3} key={i}>
                            <ProjectCard
                                event={e}
                                projectIndex={i}
                                duration={duration}
                                project={e}
                                profiles={featuredProjectUserProfiles}
                            />
                        </Grid>
                    );
                })}
        </AnimatedGridContainer>
    );
};

export default FeaturedProjects;
