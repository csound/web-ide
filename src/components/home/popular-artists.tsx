import { useEffect, useState } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { range } from "ramda";
import StarIcon from "@mui/icons-material/Star";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import { Link } from "react-router";
import { fetchPopularArtists } from "./actions";
import * as SS from "./styles";

const medalColors = ["#f2c94c", "#b8bfc8", "#d69e65"];
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
                <img
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
    const profiles = useSelector((store: RootState) => store.HomeReducer.profiles);

    useEffect(() => {
        dispatch(fetchPopularArtists(8));
    }, [dispatch]);

    return (
        <>
            <div css={SS.homeHeading} style={{ marginTop: 12 }}>
                <h1 css={SS.homePageHeading}>Popular Artists</h1>
                <hr css={SS.homePageHeadingBreak} />
            </div>
            <div css={SS.artistBoardSubheading}>
                Ranked by total stars across public projects
            </div>
            <div css={SS.artistBoard}>
                {popularArtistsLoading
                    ? range(0, 8).map((index) => (
                          <div key={index} css={SS.artistBoardRowSkeleton} />
                      ))
                    : popularArtists.length === 0
                      ? (
                            <div css={SS.artistBoardEmptyState}>
                                No ranked artists yet. Start starring projects to
                                build the board.
                            </div>
                        )
                    : popularArtists.map((artist, index) => {
                          const profile = profiles[artist.userUid];
                          const displayName =
                              profile?.displayName ||
                              profile?.username ||
                              `Artist ${artist.userUid.slice(0, 6)}`;
                          const username =
                              profile?.username || artist.userUid.slice(0, 8);

                          return (
                              <div key={artist.userUid} css={SS.artistBoardRow}>
                                  <div
                                      css={SS.artistRankChip(
                                          medalColors[index] || undefined
                                      )}
                                  >
                                      #{index + 1}
                                  </div>
                                  {profile?.username
                                      ? (
                                            <Link
                                                to={`profile/${profile.username}`}
                                                css={SS.artistIdentity}
                                            >
                                                <ArtistAvatar
                                                    photoUrl={profile.photoUrl}
                                                    name={displayName}
                                                />
                                                <span css={SS.artistNameGroup}>
                                                    <span
                                                        css={SS.artistDisplayName}
                                                    >
                                                        {displayName}
                                                    </span>
                                                    <span css={SS.artistUsername}>
                                                        @{username}
                                                    </span>
                                                </span>
                                            </Link>
                                        )
                                      : (
                                            <div css={SS.artistIdentityStatic}>
                                                <ArtistAvatar name={displayName} />
                                                <span css={SS.artistNameGroup}>
                                                    <span
                                                        css={SS.artistDisplayName}
                                                    >
                                                        {displayName}
                                                    </span>
                                                    <span css={SS.artistUsername}>
                                                        @{username}
                                                    </span>
                                                </span>
                                            </div>
                                        )}
                                  <div css={SS.artistStats}>
                                      <span css={SS.artistStat}>
                                          <StarIcon />
                                          {artist.totalStars}
                                      </span>
                                      <span css={SS.artistStatMuted}>
                                          <LibraryMusicIcon />
                                          {artist.projectCount} projects
                                      </span>
                                  </div>
                              </div>
                          );
                      })}
            </div>
        </>
    );
};

export default PopularArtists;
