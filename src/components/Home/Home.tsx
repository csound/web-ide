import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../Header/Header";
import withStyles from "./styles";
import { getPopularProjects, getStars, searchProjects } from "./actions";
import { debounce } from "lodash";

import {
    HomeContainer,
    StyledTextField,
    ProjectSectionHeader,
    HorizontalRule,
    AnimatedGridContainer
} from "./HomeUI";

import {
    selectStars,
    selectProjectLastModified,
    selectDisplayedStarredProjects,
    selectFeaturedProjectUserProfiles,
    selectSearchedProjectUserProfiles,
    selectDisplayedRandomProjects,
    selectSearchedProjects,
    selectSearchedProjectsTotal
} from "./selectors";
import { Transition, TransitionGroup } from "react-transition-group";
import { Grid } from "@material-ui/core";
import ProjectCard from "./ProjectCard";
import { SEARCH_PROJECTS } from "./types";

const duration = 200;

const Home = props => {
    const { classes } = props;
    const dispatch = useDispatch();
    const [showFeaturedProjects, setShowFeaturedProjects] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [searchOffset, setSearchOffset] = useState(0);
    const stars = useSelector(selectStars);
    const projectLastModified = useSelector(selectProjectLastModified);
    const starredProjects = useSelector(selectDisplayedStarredProjects);
    const randomProjects = useSelector(selectDisplayedRandomProjects);
    const searchedProjects = useSelector(selectSearchedProjects);
    const searchedProjectsTotal = useSelector(selectSearchedProjectsTotal);
    const featuredProjectUserProfiles = useSelector(
        selectFeaturedProjectUserProfiles
    );
    const searchedProjectUserProfiles = useSelector(
        selectSearchedProjectUserProfiles
    );
    useEffect(() => {
        if (Array.isArray(stars) === true) {
            dispatch(getPopularProjects());
        }
    }, [dispatch, stars, projectLastModified]);

    useEffect(() => {
        dispatch(getStars());
    }, [dispatch]);

    useEffect(() => {
        if (searchValue === "" && searchedProjects !== false) {
            dispatch({ type: SEARCH_PROJECTS, payload: false });
        }
    }, [dispatch, searchValue, searchedProjects]);

    useEffect(() => {
        if (searchValue.length > 0 && showFeaturedProjects === true) {
            setShowFeaturedProjects(false);
        }

        if (searchValue.length === 0 && showFeaturedProjects === false) {
            setShowFeaturedProjects(true);
        }
    }, [searchValue, setShowFeaturedProjects, showFeaturedProjects]);

    const handler = useCallback(
        debounce((query: string, offset: number) => {
            if (query !== "") {
                dispatch(searchProjects(query, offset));
            }
        }, 200),
        []
    );

    return (
        <div className={classes.root}>
            <Header />
            <HomeContainer
                colorA={"rgba(30, 30, 30, 1)"}
                colorB={"rgba(40, 40, 40, 1)"}
                colorC={"rgba(20, 20, 20, 1)"}
            >
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <StyledTextField
                            fullWidth
                            value={searchValue}
                            variant="outlined"
                            id="standard-name"
                            label="Search Projects"
                            className={classes.textField}
                            margin="normal"
                            InputLabelProps={{
                                classes: {
                                    root: classes.cssLabel,
                                    focused: classes.cssFocused
                                }
                            }}
                            InputProps={{
                                classes: {
                                    root: classes.cssOutlinedInput,
                                    focused: classes.cssFocused,
                                    notchedOutline: classes.notchedOutline
                                },
                                inputMode: "numeric"
                            }}
                            onChange={e => {
                                const query = e.target.value;
                                setSearchValue(query);

                                handler(query, searchOffset);
                            }}
                        />
                    </Grid>
                </Grid>
                <TransitionGroup component={null}>
                    {searchValue === "" && (
                        <Transition appear timeout={duration}>
                            {transitionState => {
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
                                                    <Grid
                                                        item
                                                        xs={6}
                                                        sm={3}
                                                        key={i}
                                                    >
                                                        <ProjectCard
                                                            event={e}
                                                            projectIndex={i}
                                                            duration={duration}
                                                            project={e}
                                                            profiles={
                                                                featuredProjectUserProfiles
                                                            }
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
                                                    <Grid
                                                        item
                                                        xs={6}
                                                        sm={3}
                                                        key={i}
                                                    >
                                                        <ProjectCard
                                                            event={e}
                                                            projectIndex={i}
                                                            duration={duration}
                                                            project={e}
                                                            profiles={
                                                                featuredProjectUserProfiles
                                                            }
                                                        />
                                                    </Grid>
                                                );
                                            })}
                                    </AnimatedGridContainer>
                                );
                            }}
                        </Transition>
                    )}
                    {searchValue !== "" && (
                        <Transition appear timeout={duration}>
                            {transitionState => {
                                return (
                                    <AnimatedGridContainer
                                        duration={duration}
                                        container
                                        spacing={3}
                                        className={transitionState}
                                    >
                                        <Grid item xs={12}>
                                            <ProjectSectionHeader>
                                                Search Results
                                                <HorizontalRule />
                                            </ProjectSectionHeader>
                                        </Grid>

                                        {Array.isArray(searchedProjects) &&
                                            searchedProjects.map((e, i) => {
                                                return (
                                                    <Grid
                                                        item
                                                        xs={6}
                                                        sm={3}
                                                        key={i}
                                                    >
                                                        <Transition
                                                            appear
                                                            timeout={duration}
                                                        >
                                                            {transitionState => {
                                                                return (
                                                                    <ProjectCard
                                                                        event={
                                                                            e
                                                                        }
                                                                        projectIndex={
                                                                            i
                                                                        }
                                                                        duration={
                                                                            duration
                                                                        }
                                                                        project={
                                                                            e
                                                                        }
                                                                        profiles={
                                                                            searchedProjectUserProfiles
                                                                        }
                                                                        transitionStatus={
                                                                            transitionState
                                                                        }
                                                                    />
                                                                );
                                                            }}
                                                        </Transition>
                                                    </Grid>
                                                );
                                            })}
                                    </AnimatedGridContainer>
                                );
                            }}
                        </Transition>
                    )}
                </TransitionGroup>
            </HomeContainer>
        </div>
    );
};

export default withStyles(Home);
