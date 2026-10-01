import { useEffect } from "react";
import { Link } from "react-router";
import StarIcon from "@mui/icons-material/Star";
import { useDispatch, useSelector } from "@root/store";
import ProjectAvatar from "@elem/project-avatar";
import { fetchPopularProjects } from "./actions";
import { RankingBoard } from "./ranking-board";
import * as SS from "./styles";

const PopularProjects = () => {
    const dispatch = useDispatch();
    const {
        popularProjects,
        popularProjectsLoading,
        popularProjectsError,
        profiles
    } = useSelector((store) => store.HomeReducer);

    useEffect(() => {
        dispatch(fetchPopularProjects());
    }, [dispatch]);

    return (
        <RankingBoard
            id="popular-projects"
            title="Popular Projects"
            description="The most starred public projects"
            loading={popularProjectsLoading}
            error={popularProjectsError}
            empty={
                popularProjects.length === 0 &&
                "No starred projects yet. Star a project to add it here."
            }
            onRetry={() => dispatch(fetchPopularProjects())}
        >
            {popularProjects.map((project, index) => {
                const profile = profiles[project.userUid];
                const author =
                    profile?.displayName ||
                    profile?.username ||
                    "Csound artist";
                return (
                    <li key={project.projectUid} css={SS.artistBoardRow}>
                        <span css={SS.artistRank}>#{index + 1}</span>
                        <div css={SS.artistIdentityStatic}>
                            <Link
                                to={"/editor/" + project.projectUid}
                                css={SS.projectArtwork}
                                tabIndex={-1}
                                aria-hidden="true"
                            >
                                <ProjectAvatar
                                    iconName={project.iconName}
                                    iconBackgroundColor={
                                        project.iconBackgroundColor
                                    }
                                    iconForegroundColor={
                                        project.iconForegroundColor
                                    }
                                />
                            </Link>
                            <span css={SS.artistNameGroup}>
                                <Link
                                    css={SS.rankingLink}
                                    to={"/editor/" + project.projectUid}
                                    title={project.name}
                                >
                                    {project.name}
                                </Link>
                                {profile?.username ? (
                                    <Link
                                        css={SS.rankingAuthor}
                                        to={"/profile/" + profile.username}
                                        title={author}
                                    >
                                        {author}
                                    </Link>
                                ) : (
                                    <span css={SS.artistUsername}>
                                        {author}
                                    </span>
                                )}
                            </span>
                        </div>
                        <span
                            css={SS.artistStat}
                            aria-label={project.starCount + " stars"}
                        >
                            <StarIcon />
                            {project.starCount}
                        </span>
                    </li>
                );
            })}
        </RankingBoard>
    );
};

export default PopularProjects;
