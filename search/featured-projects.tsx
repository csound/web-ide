import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
    // ProjectSectionHeader,
    HorizontalRule,
    PaginationIconButton
} from "./home-ui";
import { Refresh as RefreshIcon } from "@material-ui/icons";
import LeftIcon from "@material-ui/icons/ArrowBack";
import RightIcon from "@material-ui/icons/ArrowForward";
import ProjectCard from "./project-card";
import { getRandomProjects } from "./actions";
import { IFirestoreProject } from "@db/types";

const FeaturedProjects = ({
    duration,
    starredProjects,
    randomProjectUserProfiles,
    popularProjectUserProfiles,
    randomProjects
}: {
    duration: number;
    starredProjects: Record<string, any>;
    randomProjectUserProfiles: IFirestoreProject[];
    popularProjectUserProfiles: IFirestoreProject[];
    randomProjects: IFirestoreProject[];
}): React.ReactElement => {
    const [popularProjectOffset, setPopularProjectOffset] = useState(0);

    const dispatch = useDispatch();

    // useEffect(() => {
    //     dispatch(getPopularProjects(false, popularProjectOffset));
    // }, [dispatch, popularProjectOffset]);

    return (
        <div>
            <div>
                <h1>Popular Projects</h1>
                <div>
                    <PaginationIconButton
                        aria-label="left"
                        onClick={() => {
                            let newOffset = popularProjectOffset - 1;
                            newOffset = newOffset < 0 ? 0 : newOffset;
                            setPopularProjectOffset(newOffset);
                        }}
                    >
                        <LeftIcon />
                    </PaginationIconButton>
                    <PaginationIconButton
                        aria-label="right"
                        onClick={() => {
                            setPopularProjectOffset(popularProjectOffset + 1);
                        }}
                    >
                        <RightIcon />
                    </PaginationIconButton>
                </div>
            </div>
            <HorizontalRule />
            <div>
                {Array.isArray(starredProjects) &&
                    starredProjects.length > 0 &&
                    starredProjects.map((item, index) => {
                        return (
                            <ProjectCard
                                key={`starred${index}`}
                                projectIndex={index}
                                duration={duration}
                                project={item}
                                profiles={popularProjectUserProfiles}
                            />
                        );
                    })}
            </div>
            <div>
                {Array.isArray(starredProjects) &&
                    starredProjects.length === 0 && (
                        <div>
                            <strong>No results found</strong>
                        </div>
                    )}
            </div>
            <div>
                <div>
                    <h1>Other Projects</h1>
                    <div>
                        <PaginationIconButton
                            aria-label="refresh"
                            onClick={() => {
                                dispatch(getRandomProjects());
                            }}
                        >
                            <RefreshIcon />
                        </PaginationIconButton>
                    </div>
                </div>
                <HorizontalRule />
            </div>
            <div>
                {Array.isArray(randomProjects) &&
                    randomProjects.map((item: IFirestoreProject, index) => {
                        return (
                            <ProjectCard
                                key={`random${index}`}
                                projectIndex={index}
                                duration={duration}
                                project={item}
                                profiles={randomProjectUserProfiles}
                            />
                        );
                    })}
            </div>
        </div>
    );
};

export default FeaturedProjects;
