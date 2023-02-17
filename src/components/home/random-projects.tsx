import React from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import IconButton from "@mui/material/IconButton";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import { path, range } from "ramda";
import { fetchRandomProjects } from "./actions";
import { useTheme } from "@emotion/react";
import ProjectCard, { ProjectCardSkeleton } from "./project-card";
import * as SS from "./styles";

const RandomProjects = (): React.ReactElement => {
    const dispatch = useDispatch();
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            let randomProjects;
            try {
                randomProjects = fetchRandomProjects();
            } catch (error) {
                console.error(error);
            }
            randomProjects && dispatch(randomProjects);
        }
    }, [dispatch, isMounted, setIsMounted]);
    const theme = useTheme();

    const profiles = useSelector((store: RootState) => {
        return path(["HomeReducer", "profiles"], store);
    });

    const randomProjects = useSelector((store: RootState) => {
        return path(["HomeReducer", "randomProjects"], store);
    });

    const randomProjectsLoading = useSelector((store: RootState) => {
        return path(["HomeReducer", "randomProjectsLoading"], store);
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

export default RandomProjects;
