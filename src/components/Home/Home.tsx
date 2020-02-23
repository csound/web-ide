import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../Header/Header";
import withStyles from "./styles";
import {
    searchProjects,
    getPopularProjects,
    getTags,
    getStars
} from "./actions";
import {
    HomeContainer,
    StyledTextField,
    ProjectSectionHeader,
    HorizontalRule,
    AnimatedGridContainer
} from "./HomeUI";

import {
    selectTags,
    selectStars,
    selectProjectLastModified,
    selectDisplayedStarredProjects,
    selectProjectUserProfiles
} from "./selectors";
import FeaturedProjects from "./FeaturedProjects";
import SearchResults from "./SearchResults";
import { Transition, TransitionGroup } from "react-transition-group";
import { Grid, Paper } from "@material-ui/core";
import ProjectCard from "./ProjectCard";

const duration = 200;

const Home = props => {
    const { classes } = props;
    const dispatch = useDispatch();
    const [showFeaturedProjects, setShowFeaturedProjects] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const tags = useSelector(selectTags);
    const stars = useSelector(selectStars);
    const projectLastModified = useSelector(selectProjectLastModified);
    const starredProjects = useSelector(selectDisplayedStarredProjects);
    const projectUserProfiles = useSelector(selectProjectUserProfiles);
    const columnCount = 4;
    const columnPlaceHolderArray = new Array(columnCount).fill(0);
    let projectColumnCount = 4;
    useEffect(() => {
        if (Array.isArray(tags) === true && Array.isArray(stars) === true) {
            dispatch(getPopularProjects(8));
        }
    }, [dispatch, tags, stars, projectLastModified]);

    useEffect(() => {
        dispatch(getTags());
        dispatch(getStars());
    }, [dispatch]);

    useEffect(() => {
        if (searchValue.length > 0 && showFeaturedProjects === true) {
            setShowFeaturedProjects(false);
        }

        if (searchValue.length === 0 && showFeaturedProjects === false) {
            setShowFeaturedProjects(true);
        }
    }, [searchValue, setShowFeaturedProjects, showFeaturedProjects]);

    console.log(starredProjects);

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
                                setSearchValue(e.target.value);
                                // dispatch(searchProjects(e.target.value));
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
                                                    <Grid item xs={6} sm={3}>
                                                        <ProjectCard
                                                            key={i}
                                                            event={e}
                                                            projectIndex={i}
                                                            duration={duration}
                                                            projectColumnCount={
                                                                projectColumnCount
                                                            }
                                                            project={e}
                                                            profiles={
                                                                projectUserProfiles
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
                                        {Array.isArray(starredProjects) &&
                                            starredProjects.map((e, i) => {
                                                return (
                                                    <Grid item xs={6} sm={3}>
                                                        <ProjectCard
                                                            key={i}
                                                            event={e}
                                                            projectIndex={i}
                                                            duration={duration}
                                                            projectColumnCount={
                                                                projectColumnCount
                                                            }
                                                            project={e}
                                                            profiles={
                                                                projectUserProfiles
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
                                        {Array.isArray(starredProjects) &&
                                            starredProjects.map((e, i) => {
                                                return (
                                                    <Grid item xs={6} sm={3}>
                                                        <ProjectCard
                                                            key={i}
                                                            event={e}
                                                            projectIndex={i}
                                                            duration={duration}
                                                            projectColumnCount={
                                                                projectColumnCount
                                                            }
                                                            project={e}
                                                            profiles={
                                                                projectUserProfiles
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
                </TransitionGroup>
            </HomeContainer>
        </div>
    );
};

export default withStyles(Home);
