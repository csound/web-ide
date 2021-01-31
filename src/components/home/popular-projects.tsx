import React from "react";
import Loader from "react-loader-spinner";
import { path, range } from "ramda";
import { useSelector } from "react-redux";
import { IStore } from "@store/types";
import { IProject } from "@comp/projects/types";
import LeftIcon from "@material-ui/icons/ArrowBack";
import RightIcon from "@material-ui/icons/ArrowForward";
import IconButton from "@material-ui/core/IconButton";
import { Theme, useTheme } from "@emotion/react";
import ProjectCard from "./project-card";
import * as SS from "./styles";

const CardSkeleton = ({ theme }: { theme: Theme }): React.ReactElement => (
    <div css={SS.cardLoderSkeleton}>
        <span className="skeleton-photo" />
        <span className="skeleton-name" />
        <span className="skeleton-description" />
        <Loader
            type="Bars"
            color={theme.altTextColor}
            height={100}
            width={100}
        />
    </div>
);

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
        return path(["HomeReducer", "popularProjectsTotalRecords"], store) < 0;
    });

    return (
        <>
            <div css={SS.homeHeading}>
                <IconButton
                    aria-label="left"
                    css={SS.paginationButton(!isLoading && hasPrevious)}
                    style={{ right: 48 }}
                    onClick={handlePopularProjectsPreviousPage}
                    disabled={isLoading || !hasPrevious}
                >
                    <LeftIcon />
                </IconButton>
                <IconButton
                    aria-label="right"
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
                          <CardSkeleton theme={theme} key={index} />
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
                              <CardSkeleton theme={theme} key={index} />
                          );
                      })}
            </div>
        </>
    );
};

export default PopularProjects;
