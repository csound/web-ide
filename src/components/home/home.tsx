import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "@root/store";
import { Header } from "@comp/header/header";
// import Search from "./search";
import PopularProjects from "./popular-projects";
import RandomProjects from "./random-projects";
import { homeBackground } from "./background-style";
import { fetchPopularProjects } from "./actions";
import {
    selectPopularProjectsFetchOffset,
    selectPopularProjectsSlice
} from "./selectors";

const Home = () => {
    const dispatch = useDispatch();

    const popularProjectsFetchOffset = useSelector(
        selectPopularProjectsFetchOffset
    );

    const [currentPopularProjectsOffset, setCurrentPopularProjectsOffset] =
        useState(0);

    const currentPopularProjectsPagination = useSelector(
        selectPopularProjectsSlice(
            popularProjectsFetchOffset < 0 ? 0 : currentPopularProjectsOffset,
            popularProjectsFetchOffset < 0
                ? -1
                : currentPopularProjectsOffset + 8
        )
    );

    const handlePopularProjectsNextPage = useCallback(() => {
        try {
            dispatch(fetchPopularProjects(currentPopularProjectsOffset));
        } catch (error) {
            console.error(error);
        }
        // if (popularProjects) {
        //     dispatch(popularProjects);
        //     setCurrentPopularProjectsOffset(
        //         currentPopularProjectsOffset + 8
        //     );
        // }
    }, [dispatch, currentPopularProjectsOffset]);

    const handlePopularProjectsPreviousPage = useCallback(() => {
        dispatch(fetchPopularProjects(currentPopularProjectsOffset));
        setCurrentPopularProjectsOffset(currentPopularProjectsOffset - 8);
    }, [dispatch, currentPopularProjectsOffset]);

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
        document.title = "Csound Web-IDE";
    }, []);

    return (
        <>
            <Header />
            <div css={homeBackground}>
                {/* <Search /> */}
                {/* <p>Search is being fixed...</p> */}
                {/* <PopularProjects
                    projects={currentPopularProjectsPagination || []}
                    handlePopularProjectsNextPage={
                        handlePopularProjectsNextPage
                    }
                    handlePopularProjectsPreviousPage={
                        handlePopularProjectsPreviousPage
                    }
                    hasPrevious={currentPopularProjectsOffset > 0}
                /> */}
                <RandomProjects />
            </div>
        </>
    );
};

export default Home;
