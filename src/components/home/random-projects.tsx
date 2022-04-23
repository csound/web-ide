import React from "react";
import IconButton from "@material-ui/core/IconButton";
import ShuffleIcon from "@material-ui/icons/Shuffle";
import { path, range } from "ramda";
import { useDispatch, useSelector } from "react-redux";
import { fetchRandomProjects } from "./actions";
import { IStore } from "@store/types";
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

    const profiles = useSelector((store: IStore) => {
        return path(["HomeReducer", "profiles"], store);
    });

    const randomProjects = useSelector((store: IStore) => {
        return path(["HomeReducer", "randomProjects"], store);
    });

    const randomProjectsLoading = useSelector((store: IStore) => {
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
