import React from "react";
import Loader from "react-loader-spinner";
import { useTheme } from "@emotion/react";
import { isEmpty, path } from "ramda";
import { searchProjects } from "./actions";
import { selectSearchResult } from "./selectors";
import { IStore } from "@store/types";
import { IProject } from "@comp/projects/types";
import TextField from "@material-ui/core/TextField";
import { useDispatch, useSelector } from "react-redux";
import { debounce } from "throttle-debounce";
import LeftIcon from "@material-ui/icons/ArrowBack";
import RightIcon from "@material-ui/icons/ArrowForward";
import IconButton from "@material-ui/core/IconButton";
import ProjectCard from "./project-card";
import * as SS from "./styles";

const doSearch = debounce(100, (query, offset, dispatch) => {
    dispatch(searchProjects(query, offset));
});

const Search = (): React.ReactElement => {
    const dispatch = useDispatch();
    const theme = useTheme();

    const searchResult: IProject[] = useSelector(selectSearchResult);
    const profiles = useSelector((store: IStore) => {
        return path(["HomeReducer", "profiles"], store);
    });

    const searchQuery = useSelector((store: IStore) => {
        return path(["HomeReducer", "searchQuery"], store);
    });

    const searchProjectsRequest = useSelector((store: IStore) => {
        return path(["HomeReducer", "searchProjectsRequest"], store);
    });

    const searchPaginationOffset = useSelector((store: IStore) => {
        return path(["HomeReducer", "searchPaginationOffset"], store);
    });

    const searchResultTotalRecords = useSelector((store: IStore) => {
        return path(["HomeReducer", "searchResultTotalRecords"], store);
    });

    const onChange = React.useCallback(
        (event) => {
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
                                isEmpty(searchQuery)
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
            />
            <div css={SS.searchLoaderSpinner}>
                <Loader
                    type="ThreeDots"
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
