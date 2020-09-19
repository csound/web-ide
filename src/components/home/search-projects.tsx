import React, { useState } from "react";
import {
    AnimatedGridContainer,
    ProjectSectionHeader,
    HorizontalRule,
    SearchProjectWaitContainer,
    PaginationIconButton
} from "./home-ui";
import { searchProjects } from "./actions";
import { Grid } from "@material-ui/core";
import ProjectCard from "./project-card";
import LeftIcon from "@material-ui/icons/ArrowBack";
import RightIcon from "@material-ui/icons/ArrowForward";
import { TransitionGroup, Transition } from "react-transition-group";
import { ThreeBounce } from "better-react-spinkit";
import { selectSearchedProjectsTotal } from "./selectors";
import { useSelector, useDispatch } from "react-redux";
const SearchProjects = ({
    duration,
    searchedProjects,
    searchedProjectUserProfiles,
    transitionState,
    requesting,
    query
}) => {
    const [pageOffset, setPageOffset] = useState(0);
    const dispatch = useDispatch();
    const searchedProjectsTotal = useSelector(selectSearchedProjectsTotal);

    const disableForward = pageOffset * 8 + 8 > searchedProjectsTotal;
    const disableBackward = pageOffset === 0;
    const handlePageOffset = (offset) => {
        if (offset === 1 && (pageOffset + 1) * 8 <= searchedProjectsTotal) {
            dispatch(searchProjects(query, (pageOffset + offset) * 8));
            setPageOffset(pageOffset + 1);
        } else if (offset === -1 && pageOffset > 0) {
            dispatch(searchProjects(query, (pageOffset + offset) * 8));
            setPageOffset(pageOffset - 1);
        }
    };

    const getResultRange = () => {
        if (requesting) {
            return "";
        } else if (!requesting && searchedProjects === false) {
            return "";
        } else {
            return `${1 + pageOffset * 8}-${
                pageOffset * 8 + searchedProjects.length
            } of ${searchedProjectsTotal}`;
        }
    };
    return (
        <AnimatedGridContainer
            duration={duration}
            container
            spacing={3}
            className={transitionState}
        >
            <Grid item xs={12}>
                <ProjectSectionHeader container justify="space-between">
                    <Grid item>Search Results: {getResultRange()}</Grid>
                    <Grid item>
                        <PaginationIconButton
                            aria-label="left"
                            onClick={() => {
                                handlePageOffset(-1);
                            }}
                            disabled={disableBackward}
                        >
                            <LeftIcon />
                        </PaginationIconButton>
                        <PaginationIconButton
                            aria-label="right"
                            onClick={() => {
                                handlePageOffset(1);
                            }}
                            disabled={disableForward}
                        >
                            <RightIcon />
                        </PaginationIconButton>
                    </Grid>
                </ProjectSectionHeader>
                <HorizontalRule />
            </Grid>
            <TransitionGroup>
                {!requesting && Array.isArray(searchedProjects) && (
                    <Transition appear timeout={duration}>
                        {(transitionState) => {
                            return (
                                <>
                                    {searchedProjects.map(
                                        (searchEvent, index) => {
                                            return (
                                                <Grid
                                                    item
                                                    xs={6}
                                                    sm={3}
                                                    key={index}
                                                >
                                                    <ProjectCard
                                                        event={searchEvent}
                                                        projectIndex={index}
                                                        duration={duration}
                                                        project={searchEvent}
                                                        profiles={
                                                            searchedProjectUserProfiles
                                                        }
                                                        transitionStatus={
                                                            transitionState
                                                        }
                                                    />
                                                </Grid>
                                            );
                                        }
                                    )}
                                </>
                            );
                        }}
                    </Transition>
                )}
                {!requesting && searchedProjects === false && (
                    <Transition appear timeout={duration}>
                        {(transitionState) => {
                            return (
                                <SearchProjectWaitContainer
                                    className={transitionState}
                                    duration={duration}
                                >
                                    No results found
                                </SearchProjectWaitContainer>
                            );
                        }}
                    </Transition>
                )}
                {requesting && (
                    <Transition appear timeout={duration}>
                        {(transitionState) => {
                            return (
                                <SearchProjectWaitContainer
                                    className={transitionState}
                                    duration={duration}
                                >
                                    <ThreeBounce size={20} color={"white"} />
                                </SearchProjectWaitContainer>
                            );
                        }}
                    </Transition>
                )}
            </TransitionGroup>
        </AnimatedGridContainer>
    );
};

export default SearchProjects;
