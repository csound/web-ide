import { useEffect, useState } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import IconButton from "@mui/material/IconButton";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import { range } from "ramda";
import { fetchRandomProjects } from "./actions";
import { useTheme } from "@emotion/react";
import { RandomProjectResponse } from "./types";
import { ProjectCard, ProjectCardSkeleton } from "./project-card";
import * as SS from "./styles";

const RandomProjects = () => {
    const dispatch = useDispatch();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            dispatch(fetchRandomProjects());
        }
    }, [dispatch, isMounted, setIsMounted]);

    const theme = useTheme();
    const profiles = useSelector((store: RootState) => {
        return store.HomeReducer.profiles;
    });

    const randomProjects: RandomProjectResponse[] = useSelector(
        (store: RootState) => {
            return store.HomeReducer.randomProjects;
        }
    );

    const randomProjectsLoading: boolean = useSelector((store: RootState) => {
        return store.HomeReducer.randomProjectsLoading;
    });

    return (
        <>
            <div css={SS.homeHeading} style={{ marginTop: 12 }}>
                <IconButton
                    aria-label="shuffle"
                    data-tip="Shuffle for more random projects"
                    css={SS.shuffleButton}
                    disabled={randomProjectsLoading}
                    onClick={() => dispatch(fetchRandomProjects())}
                >
                    <ShuffleIcon />
                </IconButton>

                <h1 css={SS.homePageHeading}>Random Projects</h1>
                <hr css={SS.homePageHeadingBreak} />
            </div>
            <div css={SS.doubleGridContainer}>
                {randomProjectsLoading
                    ? range(0, 8).map((index) => (
                          <ProjectCardSkeleton theme={theme} key={index} />
                      ))
                    : randomProjects.map((project, index) => {
                          const profile = profiles[project.userUid];
                          return profile ? (
                              <ProjectCard
                                  key={`p${index}${project.projectUid}`}
                                  projectIndex={index}
                                  project={project}
                                  profile={profile}
                              />
                          ) : (
                              <ProjectCardSkeleton theme={theme} key={index} />
                          );
                      })}
            </div>
        </>
    );
};

export default RandomProjects;
