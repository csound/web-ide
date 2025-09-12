import React from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { ThreeDots } from "react-loader-spinner";
import { useTheme } from "@emotion/react";
import { isEmpty, path } from "ramda";
import { searchProjects } from "./actions";
import { selectSearchResult } from "./selectors";
import { IProject } from "@comp/projects/types";
import TextField from "@mui/material/TextField";
import { debounce } from "throttle-debounce";
import LeftIcon from "@mui/icons-material/ArrowBack";
import RightIcon from "@mui/icons-material/ArrowForward";
import IconButton from "@mui/material/IconButton";
import { ProjectCard } from "./project-card";
import * as SS from "./styles";

const doSearch = debounce(100, (query, offset, dispatch) => {
    dispatch(searchProjects(query, offset));
});

const Search = () => {
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
        <>
            <div css={SS.homeHeading}>
                {searchQuery && searchQuery.length > 0 && (
                    <>
                        <IconButton
                            aria-label="left"
                            data-tip="Previous results"
                            css={SS.paginationButton(true)}
                            style={{ right: 48 }}
                            onClick={() =>
                                doSearch(
                                    searchQuery,
                                    Math.max(searchPaginationOffset, 0) + 8,
                                    dispatch
                                )
                            }
                            disabled={
                                searchPaginationOffset < 1 ||
                                searchResultTotalRecords < 1 ||
                                isEmpty(searchQuery) ||
                                searchResultTotalRecords <= 8
                            }
                        >
                            <LeftIcon />
                        </IconButton>
                        <IconButton
                            aria-label="right"
                            data-tip="Next results"
                            css={SS.paginationButton(true)}
                            onClick={() =>
                                doSearch(
                                    searchQuery,
                                    Math.max(searchPaginationOffset - 8, 0),
                                    dispatch
                                )
                            }
                            disabled={
                                searchPaginationOffset < 0 ||
                                searchResultTotalRecords < 0 ||
                                isEmpty(searchQuery) ||
                                searchResultTotalRecords <= 8 ||
                                !(
                                    searchPaginationOffset <
                                    searchResultTotalRecords
                                )
                            }
                        >
                            <RightIcon />
                        </IconButton>
                    </>
                )}

                <h1 css={SS.homePageHeading}>Search Projects</h1>
                <hr css={SS.homePageHeadingBreak} />
            </div>
            <TextField
                onChange={onChange}
                css={SS.searchField}
                name="search-field"
                label="Search field"
                type="search"
                variant="outlined"
                sx={{
                    "& .MuiInputBase-root": {
                        '& input[type="search"]::-webkit-search-cancel-button':
                            {
                                WebkitAppearance: "none",
                                appearance: "none",
                                height: "20px",
                                width: "20px",
                                borderRadius: "50%",
                                background: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E") no-repeat center`,
                                backgroundSize: "16px 16px",
                                cursor: "pointer",
                                opacity: 0.6,
                                transition: "opacity 0.2s ease",
                                "&:hover": {
                                    opacity: 1,
                                    background: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E") no-repeat center`,
                                    backgroundSize: "16px 16px"
                                }
                            },
                        '& input[type="search"]:not(:placeholder-shown)::-webkit-search-cancel-button':
                            {
                                background: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E") no-repeat center`,
                                backgroundSize: "16px 16px",
                                opacity: 0.8
                            }
                    }
                }}
            />
            <div css={SS.searchLoaderSpinner}>
                <ThreeDots
                    visible={searchProjectsRequest}
                    color={theme.buttonIcon}
                    height={200}
                    width={200}
                />
            </div>
            {!searchProjectsRequest && searchQuery.length > 0 && (
                <div
                    css={SS.doubleGridContainer}
                    style={{ marginTop: 0, marginBottom: 12 }}
                >
                    {searchResult.map((project, index) => {
                        return profiles[project.userUid] ? (
                            <ProjectCard
                                key={`p${index}`}
                                projectIndex={index}
                                project={project}
                                profile={profiles[project.userUid]}
                            />
                        ) : (
                            <div key={index}></div>
                        );
                    })}
                </div>
            )}
        </>
    );
};

export default Search;
