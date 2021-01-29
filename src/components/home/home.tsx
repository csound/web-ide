import SearchProjects from "./search-projects";
import FeaturedProjects from "./featured-projects";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../header/header";
import withStyles from "./styles";
import { getPopularProjects, searchProjects } from "./actions";
import { debounce } from "lodash";
import { HomeContainer, StyledTextField, GlobalStyle } from "./home-ui";
import {
    selectDisplayedStarredProjects,
    selectSearchedProjectUserProfiles,
    selectDisplayedRandomProjects,
    selectSearchedProjects,
    selectSearchProjectsRequest,
    selectRandomProjectUserProfiles,
    selectPopularProjectUserProfiles
} from "./selectors";
import { Grid } from "@material-ui/core";
import { SEARCH_PROJECTS_SUCCESS } from "./types";

const duration = 200;

const Home = ({ classes }) => {
    const dispatch = useDispatch();
    const [showFeaturedProjects, setShowFeaturedProjects] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const starredProjects = useSelector(selectDisplayedStarredProjects);
    const randomProjects = useSelector(selectDisplayedRandomProjects);
    const searchedProjects = useSelector(selectSearchedProjects);
    const searchProjectsRequest = useSelector(selectSearchProjectsRequest);
    const randomProjectUserProfiles = useSelector(
        selectRandomProjectUserProfiles
    );
    const popularProjectUserProfiles = useSelector(
        selectPopularProjectUserProfiles
    );
    const searchedProjectUserProfiles = useSelector(
        selectSearchedProjectUserProfiles
    );

    useEffect(() => {
        // start at top on init
        window.scrollTo(0, 0);
        const rootElement = document.querySelector("#root");
        rootElement && rootElement.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        dispatch(getPopularProjects(true));
    }, [dispatch]);

    useEffect(() => {
        if (searchValue === "" && searchedProjects.length === 0) {
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

    const handler = debounce((query: string, offset: number) => {
        if (query !== "") {
            dispatch(searchProjects(query, offset));
        }
    }, 200);

    return (
        <>
            <Header />
            <GlobalStyle
                colorA={"rgba(30, 30, 30, 1)"}
                colorB={"rgba(40, 40, 40, 1)"}
                colorC={"rgba(20, 20, 20, 1)"}
            />
            <HomeContainer>
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
                            onChange={(event) => {
                                const query = event.target.value;
                                setSearchValue(query);
                                handler(query, 0);
                            }}
                        />
                    </Grid>
                </Grid>
                {/* eslint-disable-next-line  unicorn/no-null */}

                <FeaturedProjects
                    duration={duration}
                    starredProjects={starredProjects}
                    randomProjects={randomProjects}
                    randomProjectUserProfiles={randomProjectUserProfiles}
                    popularProjectUserProfiles={popularProjectUserProfiles}
                />
                {searchValue !== "" && (
                    <SearchProjects
                        duration={duration}
                        searchedProjects={searchedProjects}
                        searchedProjectUserProfiles={
                            searchedProjectUserProfiles
                        }
                        requesting={searchProjectsRequest}
                        query={searchValue}
                    />
                )}
            </HomeContainer>
        </>
    );
};

export default withStyles(Home);
