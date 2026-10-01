import React from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { useTheme } from "@emotion/react";
import { path } from "ramda";
import { searchProjects } from "./actions";
import { selectSearchResult } from "./selectors";
import { IProject } from "@comp/projects/types";
import TextField from "@mui/material/TextField";
import { debounce } from "throttle-debounce";
import LeftIcon from "@mui/icons-material/ArrowBack";
import RightIcon from "@mui/icons-material/ArrowForward";
import IconButton from "@mui/material/IconButton";
import { ProjectCard, ProjectCardSkeleton } from "./project-card";
import * as SS from "./styles";

const doSearch = debounce(100, (query, offset, dispatch) => {
    dispatch(searchProjects(query, offset));
});

const Search = ({ actions }: { actions?: React.ReactNode }) => {
    const dispatch = useDispatch();
    const theme = useTheme();

    const searchResult: IProject[] = useSelector(selectSearchResult);
    const profiles = useSelector((store: RootState) => {
        return path(["HomeReducer", "profiles"], store);
    });

    const searchQuery = useSelector((store: RootState) => {
        return path(["HomeReducer", "searchQuery"], store);
    });

    const searchProjectsRequest = useSelector((store: RootState) => {
        return path(["HomeReducer", "searchProjectsRequest"], store);
    });

    const searchPaginationOffset = useSelector((store: RootState) => {
        return path(["HomeReducer", "searchPaginationOffset"], store);
    });

    const searchResultTotalRecords = useSelector((store: RootState) => {
        return path(["HomeReducer", "searchResultTotalRecords"], store);
    });

    const onChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            doSearch(event.target.value, 0, dispatch);
        },
        [dispatch]
    );

    React.useEffect(() => doSearch.cancel, []);

    return (
        <section aria-labelledby="search-projects">
            <div css={SS.homeHeading}>
                <h1 id="search-projects" css={SS.homePageHeading}>
                    Search Projects
                </h1>
                {actions}
            </div>
            <TextField
                onChange={onChange}
                css={SS.searchField}
                name="search-field"
                label="Search field"
                type="search"
                variant="outlined"
            />
            {searchQuery.length > 0 && (
                <div css={SS.searchResults}>
                    <div css={SS.homeHeading}>
                        <p css={SS.artistUsername} role="status">
                            {searchProjectsRequest
                                ? "Searching projects…"
                                : `${searchResultTotalRecords} results`}
                        </p>
                        <div css={SS.homeActions}>
                            <IconButton
                                aria-label="Previous results"
                                css={SS.paginationButton(true)}
                                onClick={() =>
                                    doSearch(
                                        searchQuery,
                                        Math.max(searchPaginationOffset - 8, 0),
                                        dispatch
                                    )
                                }
                                disabled={
                                    searchProjectsRequest ||
                                    searchPaginationOffset < 1
                                }
                            >
                                <LeftIcon />
                            </IconButton>
                            <IconButton
                                aria-label="Next results"
                                css={SS.paginationButton(true)}
                                onClick={() =>
                                    doSearch(
                                        searchQuery,
                                        searchPaginationOffset + 8,
                                        dispatch
                                    )
                                }
                                disabled={
                                    searchProjectsRequest ||
                                    searchPaginationOffset + 8 >=
                                        searchResultTotalRecords
                                }
                            >
                                <RightIcon />
                            </IconButton>
                        </div>
                    </div>
                    <div
                        css={SS.doubleGridContainer}
                        aria-busy={searchProjectsRequest}
                    >
                        {searchProjectsRequest
                            ? Array.from({ length: 4 }, (_, index) => (
                                  <ProjectCardSkeleton
                                      theme={theme}
                                      key={index}
                                  />
                              ))
                            : searchResult.map((project) => (
                                  <ProjectCard
                                      key={project.projectUid}
                                      projectIndex={0}
                                      project={project}
                                      profile={profiles[project.userUid] || {}}
                                  />
                              ))}
                    </div>
                </div>
            )}
        </section>
    );
};

export default Search;
