import SearchProjects from "./SearchProjects";
import FeaturedProjects from "./FeaturedProjects";
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../Header/Header";
import withStyles from "./styles";
import { getPopularProjects, getStars, searchProjects } from "./actions";
import { debounce } from "lodash";
import { HomeContainer, StyledTextField } from "./HomeUI";
import {
    selectStars,
    selectProjectLastModified,
    selectDisplayedStarredProjects,
    selectFeaturedProjectUserProfiles,
    selectSearchedProjectUserProfiles,
    selectDisplayedRandomProjects,
    selectSearchedProjects,
    selectSearchProjectsRequest
} from "./selectors";
import { TransitionGroup, Transition } from "react-transition-group";
import { Grid } from "@material-ui/core";
import { SEARCH_PROJECTS_SUCCESS } from "./types";

const duration = 200;

const Home = props => {
    const { classes } = props;
    const dispatch = useDispatch();
    const [showFeaturedProjects, setShowFeaturedProjects] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const stars = useSelector(selectStars);
    const projectLastModified = useSelector(selectProjectLastModified);
    const starredProjects = useSelector(selectDisplayedStarredProjects);
    const randomProjects = useSelector(selectDisplayedRandomProjects);
    const searchedProjects = useSelector(selectSearchedProjects);
    const searchProjectsRequest = useSelector(selectSearchProjectsRequest);
    // const searchedProjectsTotal = useSelector(selectSearchedProjectsTotal);
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
            dispatch({ type: SEARCH_PROJECTS_SUCCESS, payload: false });
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

                                handler(query, 0);
                            }}
                        />
                    </Grid>
                </Grid>
                <TransitionGroup component={null}>
                    {searchValue === "" && (
                        <Transition appear timeout={duration}>
                            {transitionState => {
                                return (
                                    <FeaturedProjects
                                        duration={duration}
                                        starredProjects={starredProjects}
                                        featuredProjectUserProfiles={
                                            featuredProjectUserProfiles
                                        }
                                        randomProjects={randomProjects}
                                        transitionState={transitionState}
                                    />
                                );
                            }}
                        </Transition>
                    )}
                    {searchValue !== "" && (
                        <Transition appear timeout={duration}>
                            {transitionState => {
                                return (
                                    <SearchProjects
                                        duration={duration}
                                        searchedProjects={searchedProjects}
                                        searchedProjectUserProfiles={
                                            searchedProjectUserProfiles
                                        }
                                        transitionState={transitionState}
                                        requesting={searchProjectsRequest}
                                        query={searchValue}
                                    />
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
