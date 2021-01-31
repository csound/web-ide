import React, { useState } from "react";
import {
    HorizontalRule,
    SearchProjectWaitContainer,
    PaginationIconButton
} from "./home-ui";
import { searchProjects } from "./actions";
// import { Grid } from "@material-ui/core";
// import ProjectCard from "./project-card";
import LeftIcon from "@material-ui/icons/ArrowBack";
import RightIcon from "@material-ui/icons/ArrowForward";
// import { TransitionGroup, Transition } from "react-transition-group";
import { ThreeBounce } from "better-react-spinkit";
import { selectSearchedProjectsTotal } from "./selectors";
import { useSelector, useDispatch } from "react-redux";
// import { IFirestoreProject } from "@db/types";

const SearchProjects = ({
    duration,
    searchedProjects,
    searchedProjectUserProfiles,
    requesting,
    query
}: {
    duration: number;
    searchedProjects: any;
    searchedProjectUserProfiles: any;
    requesting: boolean;
    query: string;
}): React.ReactElement => {
    const [pageOffset, setPageOffset] = useState(0);
    const dispatch = useDispatch();
    const searchedProjectsTotal = useSelector(selectSearchedProjectsTotal);

    // const disableForward = pageOffset * 8 + 8 > searchedProjectsTotal;
    // const disableBackward = pageOffset === 0;
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
        } else if (!requesting && searchedProjects.length === 0) {
            return "";
        } else {
            return `${1 + pageOffset * 8}-${
                pageOffset * 8
            } of ${searchedProjectsTotal}`;
        }
    };
    return (
        <div>
            <div>
                <div>
                    <div>Search Results: {getResultRange()}</div>
                    <div>
                        <PaginationIconButton
                            aria-label="left"
                            onClick={() => {
                                handlePageOffset(-1);
                            }}
                        >
                            <LeftIcon />
                        </PaginationIconButton>
                        <PaginationIconButton
                            aria-label="right"
                            onClick={() => {
                                handlePageOffset(1);
                            }}
                        >
                            <RightIcon />
                        </PaginationIconButton>
                    </div>
                </div>
                <HorizontalRule />
            </div>
            {!requesting &&
                Array.isArray(searchedProjects) &&
                searchedProjects.map((searchEvent, index) => (
                    <div key={index}></div>
                ))}
            {!requesting && searchedProjects.length === 0 && (
                <SearchProjectWaitContainer duration={duration}>
                    No results found
                </SearchProjectWaitContainer>
            )}
            {requesting && (
                <SearchProjectWaitContainer duration={duration}>
                    <ThreeBounce size={20} color={"white"} />
                </SearchProjectWaitContainer>
            )}
        </div>
    );
};

export default SearchProjects;
