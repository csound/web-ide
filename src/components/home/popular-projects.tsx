import React from "react";
import { isEmpty, path, range } from "ramda";
import { useSelector } from "react-redux";
import { IStore } from "@store/types";
import { IProject } from "@comp/projects/types";
import LeftIcon from "@material-ui/icons/ArrowBack";
import RightIcon from "@material-ui/icons/ArrowForward";
import IconButton from "@material-ui/core/IconButton";
import { Theme, useTheme } from "@emotion/react";
import ProjectCard, { ProjectCardSkeleton } from "./project-card";
import * as SS from "./styles";

const PopularProjects = ({
    projects,
    handlePopularProjectsNextPage,
    handlePopularProjectsPreviousPage,
    hasNext,
    hasPrevious
}: {
    projects: IProject[];
    handlePopularProjectsNextPage: () => void;
    handlePopularProjectsPreviousPage: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
}): React.ReactElement => {
    const theme: Theme = useTheme();

    const profiles = useSelector((store: IStore) => {
        return path(["HomeReducer", "profiles"], store);
    });

    const isLoading = useSelector((store: IStore) => {
        const totalRecords = path(
            ["HomeReducer", "popularProjectsTotalRecords"],
            store
        );
        return totalRecords < 0 || (isEmpty(projects) && totalRecords > 0);
    });

    return (
        <>
            <div css={SS.homeHeading}>
                <IconButton
                    aria-label="left"
                    data-tip="Previous projects"
                    css={SS.paginationButton(!isLoading && hasPrevious)}
                    style={{ right: 48 }}
                    onClick={handlePopularProjectsPreviousPage}
                    disabled={isLoading || !hasPrevious}
                >
                    <LeftIcon />
                </IconButton>
                <IconButton
                    aria-label="right"
                    data-tip="Next projects"
                    css={SS.paginationButton(!isLoading && hasNext)}
                    onClick={handlePopularProjectsNextPage}
                    disabled={isLoading || !hasNext}
                >
                    <RightIcon />
                </IconButton>
                <h1 css={SS.homePageHeading}>Popular Projects</h1>
                <hr css={SS.homePageHeadingBreak} />
            </div>
            <div css={SS.doubleGridContainer}>
                {isLoading
                    ? range(0, 8).map((index) => (
                          <ProjectCardSkeleton theme={theme} key={index} />
                      ))
                    : projects.map((project, index) => {
                          return profiles[project.userUid] ? (
                              <ProjectCard
                                  key={`p${index}`}
                                  projectIndex={index}
                                  project={project}
                                  profile={profiles[project.userUid]}
                              />
                          ) : (
                              <ProjectCardSkeleton theme={theme} key={index} />
                          );
                      })}
            </div>
        </>
    );
};

export default PopularProjects;
