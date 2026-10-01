import { useEffect, useState } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import StarIcon from "@mui/icons-material/Star";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import { Link } from "react-router";
import CachedProfileImage from "@comp/profile/cached-profile-image";
import { fetchPopularArtists } from "./actions";
import * as SS from "./styles";
import { RankingBoard } from "./ranking-board";

const avatarPlaceholderPattern =
    /avatar\/default|default_avatar|placeholder|dummy-avatar|\/anonymous|gravatar\.com\/avatar\/\?d=mp|ui-avatars\.com/i;

const getInitials = (value: string) => {
    const initials = value
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("");
    return initials || "?";
};

const ArtistAvatar = ({
    photoUrl,
    name
}: {
    photoUrl?: string;
    name: string;
}) => {
    const [hasError, setHasError] = useState(false);
    const hasValidPhoto =
        Boolean(photoUrl) &&
        !hasError &&
        !avatarPlaceholderPattern.test(photoUrl || "");

    return (
        <span css={SS.artistAvatarShell}>
            <span css={SS.artistAvatarFallback}>{getInitials(name)}</span>
            {hasValidPhoto && (
                <CachedProfileImage
                    src={photoUrl}
                    alt={name}
                    css={SS.artistAvatarImage}
                    onError={() => setHasError(true)}
                />
            )}
        </span>
    );
};

const PopularArtists = () => {
    const dispatch = useDispatch();
    const popularArtists = useSelector(
        (store: RootState) => store.HomeReducer.popularArtists
    );
    const popularArtistsLoading = useSelector(
        (store: RootState) => store.HomeReducer.popularArtistsLoading
    );
    const popularArtistsError = useSelector(
        (store: RootState) => store.HomeReducer.popularArtistsError
    );
    const profiles = useSelector(
        (store: RootState) => store.HomeReducer.profiles
    );

    useEffect(() => {
        dispatch(fetchPopularArtists());
    }, [dispatch]);

    return (
        <RankingBoard
            id="popular-artists"
            title="Popular Artists"
            description="Ranked by total stars across public projects"
            loading={popularArtistsLoading}
            error={popularArtistsError}
            empty={
                popularArtists.length === 0 &&
                "No ranked artists yet. Start starring projects to build the board."
            }
            onRetry={() => dispatch(fetchPopularArtists())}
        >
            {popularArtists.map((artist, index) => {
                const profile = profiles[artist.userUid];
                const displayName =
                    profile?.displayName ||
                    profile?.username ||
                    `Artist ${artist.userUid.slice(0, 6)}`;
                const username =
                    profile?.username || artist.userUid.slice(0, 8);

                return (
                    <li key={artist.userUid} css={SS.artistBoardRow}>
                        <span css={SS.artistRank}>#{index + 1}</span>
                        {profile?.username ? (
                            <Link
                                to={`/profile/${profile.username}`}
                                css={SS.artistIdentity}
                            >
                                <ArtistAvatar
                                    photoUrl={profile.photoUrl}
                                    name={displayName}
                                />
                                <span css={SS.artistNameGroup}>
                                    <span css={SS.artistDisplayName}>
                                        {displayName}
                                    </span>
                                    <span css={SS.artistUsername}>
                                        @{username}
                                    </span>
                                </span>
                            </Link>
                        ) : (
                            <div css={SS.artistIdentityStatic}>
                                <ArtistAvatar name={displayName} />
                                <span css={SS.artistNameGroup}>
                                    <span css={SS.artistDisplayName}>
                                        {displayName}
                                    </span>
                                    <span css={SS.artistUsername}>
                                        @{username}
                                    </span>
                                </span>
                            </div>
                        )}
                        <div css={SS.artistStats}>
                            <span
                                css={SS.artistStat}
                                aria-label={`${artist.totalStars} stars`}
                            >
                                <StarIcon />
                                {artist.totalStars}
                            </span>
                            <span css={SS.artistStatMuted}>
                                <LibraryMusicIcon />
                                {artist.projectCount} projects
                            </span>
                        </div>
                    </li>
                );
            })}
        </RankingBoard>
    );
};

export default PopularArtists;
