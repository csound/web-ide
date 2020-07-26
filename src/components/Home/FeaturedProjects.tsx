import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
    AnimatedGridContainer,
    ProjectSectionHeader,
    HorizontalRule,
    PaginationIconButton,
    SearchProjectWaitContainer
} from "./HomeUI";
import { Grid, Button } from "@material-ui/core";
import { Refresh as RefreshIcon } from "@material-ui/icons";
import LeftIcon from "@material-ui/icons/ArrowBack";
import RightIcon from "@material-ui/icons/ArrowForward";
import ProjectCard from "./ProjectCard";
import { getRandomProjects, getPopularProjects } from "./actions";
import { Transition, TransitionGroup } from "react-transition-group";
const FeaturedProjects = ({
    duration,
    starredProjects,
    randomProjectUserProfiles,
    popularProjectUserProfiles,
    randomProjects,
    transitionState
}) => {
    const [popularProjectOffset, setPopularProjectOffset] = useState(0);

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(getPopularProjects(false, popularProjectOffset));
    }, [dispatch, popularProjectOffset]);

    return (
        <AnimatedGridContainer
            duration={duration}
            container
            spacing={3}
            className={transitionState}
        >
            <Grid item xs={12}>
                <ProjectSectionHeader container justify="space-between">
                    <Grid item>Popular Projects</Grid>

                    <Grid item>
                        <PaginationIconButton
                            aria-label="left"
                            onClick={() => {
                                let newOffset = popularProjectOffset - 1;
                                newOffset = newOffset < 0 ? 0 : newOffset;
                                setPopularProjectOffset(newOffset);
                            }}
                            disabled={popularProjectOffset === 0}
                        >
                            <LeftIcon />
                        </PaginationIconButton>
                        <PaginationIconButton
                            aria-label="right"
                            onClick={() => {
                                setPopularProjectOffset(
                                    popularProjectOffset + 1
                                );
                            }}
                            disabled={starredProjects.length === 0}
                        >
                            <RightIcon />
                        </PaginationIconButton>
                    </Grid>
                </ProjectSectionHeader>
                <HorizontalRule />
            </Grid>

            {Array.isArray(starredProjects) &&
                starredProjects.length !== 0 &&
                starredProjects.map((e, i) => {
                    return (
                        <Grid item xs={6} sm={3} key={i}>
                            <ProjectCard
                                event={e}
                                projectIndex={i}
                                duration={duration}
                                project={e}
                                profiles={popularProjectUserProfiles}
                            />
                        </Grid>
                    );
                })}

            {Array.isArray(starredProjects) && starredProjects.length === 0 && (
                // <SearchProjectWaitContainer className={""} duration={duration}>
                // No results found
                // </SearchProjectWaitContainer>
                <Grid item xs={12}>
                    <ProjectSectionHeader container justify="space-between">
                        <Grid item>No results found</Grid>
                    </ProjectSectionHeader>
                </Grid>
            )}
            <Grid item xs={12}>
                <ProjectSectionHeader container justify="space-between">
                    <Grid item>Other Projects</Grid>
                    <Grid item>
                        <PaginationIconButton
                            aria-label="refresh"
                            onClick={() => {
                                dispatch(getRandomProjects());
                            }}
                        >
                            <RefreshIcon />
                        </PaginationIconButton>
                    </Grid>
                </ProjectSectionHeader>
                <HorizontalRule />
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
                                profiles={randomProjectUserProfiles}
                            />
                        </Grid>
                    );
                })}
        </AnimatedGridContainer>
    );
};

export default FeaturedProjects;
