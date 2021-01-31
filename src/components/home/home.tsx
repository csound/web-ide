import PopularProjects from "./popular-projects";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "@comp/header/header";
import { homeBackground } from "./background-style";
import { fetchPopularProjects } from "./actions";
// import { debounce } from "lodash";
import Search from "./search";
import {
    // selectSearchedProjects,
    selectPopularProjectsFetchOffset,
    selectPopularProjectsSlice
} from "./selectors";
// import { SEARCH_PROJECTS_SUCCESS } from "./types";

const Home = (): React.ReactElement => {
    const dispatch = useDispatch();
    // const [searchValue, setSearchValue] = useState("");
    // const searchedProjects = useSelector(selectSearchedProjects);

    const [
        popularProjectsFetchOffset,
        popularProjectsTotalRecords
    ] = useSelector(selectPopularProjectsFetchOffset);

    const [
        currentPopularProjectsOffset,
        setCurrentPopularProjectsOffset
    ] = useState(0);

    const currentPopularProjectsPagination = useSelector(
        selectPopularProjectsSlice(
            popularProjectsFetchOffset < 0 ? 0 : currentPopularProjectsOffset,
            popularProjectsFetchOffset < 0
                ? -1
                : currentPopularProjectsOffset + 8
        )
    );

    const handlePopularProjectsNextPage = useCallback(() => {
        if (
            popularProjectsTotalRecords > 0 &&
            currentPopularProjectsOffset < popularProjectsTotalRecords
        ) {
            dispatch(fetchPopularProjects(currentPopularProjectsOffset));
            setCurrentPopularProjectsOffset(currentPopularProjectsOffset + 8);
        }
    }, [dispatch, popularProjectsTotalRecords, currentPopularProjectsOffset]);

    const handlePopularProjectsPreviousPage = useCallback(() => {
        if (
            popularProjectsTotalRecords > 0 &&
            currentPopularProjectsOffset > 0
        ) {
            dispatch(fetchPopularProjects(currentPopularProjectsOffset));
            setCurrentPopularProjectsOffset(currentPopularProjectsOffset - 8);
        }
    }, [dispatch, popularProjectsTotalRecords, currentPopularProjectsOffset]);

    useEffect(() => {
        if (popularProjectsFetchOffset < 0) {
            dispatch(fetchPopularProjects());
        }
    }, [dispatch, popularProjectsFetchOffset]);

    useEffect(() => {
        // start at top on init
        window.scrollTo(0, 0);
        const rootElement = document.querySelector("#root");
        rootElement && rootElement.scrollTo(0, 0);
    }, []);

    // useEffect(() => {
    //     if (searchValue === "" && searchedProjects.length === 0) {
    //         dispatch({ type: SEARCH_PROJECTS_SUCCESS, payload: false });
    //     }
    // }, [dispatch, searchValue, searchedProjects]);

    // const handler = debounce((query: string, offset: number) => {
    //     if (query !== "") {
    //         dispatch(searchProjects(query, offset));
    //     }
    // }, 200);

    return (
        <>
            <Header />
            <div css={homeBackground}>
                <Search />
                <PopularProjects
                    projects={currentPopularProjectsPagination || []}
                    handlePopularProjectsNextPage={
                        handlePopularProjectsNextPage
                    }
                    handlePopularProjectsPreviousPage={
                        handlePopularProjectsPreviousPage
                    }
                    hasNext={
                        popularProjectsTotalRecords > 0 &&
                        currentPopularProjectsOffset <
                            popularProjectsTotalRecords
                    }
                    hasPrevious={currentPopularProjectsOffset > 0}
                />
            </div>
        </>
    );
};

export default Home;
