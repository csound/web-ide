import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Avatar, Button, IconButton, Skeleton } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { searchUsers, UserSearchResponse } from "./user-search-api";
import * as SS from "./styles";

const initials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => Array.from(part)[0] ?? "")
        .join("")
        .toUpperCase();

/** Remount for a new query, so paging and unfinished requests stay with it. */
const UserSearch = ({ query }: { query: string }) => {
    const [offsets, setOffsets] = useState([0]);
    const [attempt, setAttempt] = useState(0);
    const offset = offsets.at(-1)!;
    const key = `${query}:${offset}:${attempt}`;
    const [result, setResult] = useState<{
        key: string;
        response?: UserSearchResponse;
        error?: string;
    }>();
    const ready = query.trim().replace(/^@/, "").length >= 2;
    const current = result?.key === key ? result : undefined;
    const loading = ready && !current;

    useEffect(() => {
        if (!ready) return;
        let cancelled = false;
        const timer = window.setTimeout(() => {
            void searchUsers(query, offset).then(
                (response) => {
                    if (!cancelled) setResult({ key, response });
                },
                (error: unknown) => {
                    if (!cancelled)
                        setResult({
                            key,
                            error:
                                (error as { code?: string })?.code ===
                                "functions/resource-exhausted"
                                    ? "Search is busy. Try again shortly."
                                    : "Could not search users. Please try again."
                        });
                }
            );
        }, 300);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [query, offset, attempt, key, ready]);

    if (!ready)
        return (
            <p css={SS.searchHint}>
                Search names, @usernames, bios and websites. Type at least two
                characters.
            </p>
        );
    const users = current?.response?.data ?? [];
    const nextOffset = current?.response?.nextOffset;
    return (
        <div css={SS.searchResults}>
            <div css={SS.homeHeading}>
                <p css={SS.searchHint} role="status">
                    {loading
                        ? "Searching users…"
                        : current?.error
                          ? "Search unavailable"
                          : `${users.length} ${users.length === 1 ? "user" : "users"} on this page`}
                </p>
                <div css={SS.homeActions}>
                    <IconButton
                        aria-label="Previous users"
                        css={SS.paginationButton(true)}
                        disabled={loading || offsets.length === 1}
                        onClick={() => setOffsets(offsets.slice(0, -1))}
                    >
                        <ArrowBack />
                    </IconButton>
                    <IconButton
                        aria-label="Next users"
                        css={SS.paginationButton(true)}
                        disabled={loading || nextOffset == null}
                        onClick={() =>
                            nextOffset != null &&
                            setOffsets([...offsets, nextOffset])
                        }
                    >
                        <ArrowForward />
                    </IconButton>
                </div>
            </div>
            {current?.error ? (
                <div css={SS.searchEmpty} role="alert">
                    <p>{current.error}</p>
                    <Button
                        color="inherit"
                        onClick={() => setAttempt(attempt + 1)}
                    >
                        Retry
                    </Button>
                </div>
            ) : !loading && users.length === 0 ? (
                <div css={SS.searchEmpty}>
                    <h2>No users found</h2>
                    <p>
                        {nextOffset != null
                            ? "Try the next page or a more specific search."
                            : "Try another name, username or word from their bio."}
                    </p>
                </div>
            ) : (
                <ul
                    css={SS.userSearchGrid}
                    aria-label="User results"
                    aria-busy={loading}
                >
                    {loading
                        ? Array.from({ length: 4 }, (_, index) => (
                              <li
                                  key={index}
                                  css={SS.userSearchRow}
                                  aria-hidden="true"
                              >
                                  <Skeleton
                                      variant="circular"
                                      width={48}
                                      height={48}
                                      animation={false}
                                  />
                                  <div css={SS.userSearchText}>
                                      <Skeleton width="55%" animation={false} />
                                      <Skeleton width="35%" animation={false} />
                                      <Skeleton width="90%" animation={false} />
                                  </div>
                              </li>
                          ))
                        : users.map((user) => (
                              <li key={user.userUid}>
                                  <Link
                                      to={`/profile/${encodeURIComponent(user.username)}`}
                                      css={SS.userSearchLink}
                                  >
                                      <Avatar
                                          src={user.photoUrl || undefined}
                                          alt=""
                                          aria-hidden="true"
                                          sx={{
                                              width: 48,
                                              height: 48,
                                              bgcolor: "action.selected",
                                              color: "text.primary",
                                              fontSize: 16
                                          }}
                                      >
                                          {initials(
                                              user.displayName || user.username
                                          )}
                                      </Avatar>
                                      <div css={SS.userSearchText}>
                                          <span css={SS.userSearchName}>
                                              {user.displayName ||
                                                  user.username}
                                          </span>{" "}
                                          <span css={SS.userSearchUsername}>
                                              @{user.username}
                                          </span>
                                          {user.bio && (
                                              <p css={SS.userSearchBio}>
                                                  {user.bio}
                                              </p>
                                          )}
                                          {user.links[0] && (
                                              <span css={SS.userSearchWebsite}>
                                                  {new URL(
                                                      user.links[0]
                                                  ).hostname.replace(
                                                      /^www\./,
                                                      ""
                                                  )}
                                              </span>
                                          )}
                                      </div>
                                      <ArrowForward css={SS.userSearchArrow} />
                                  </Link>
                              </li>
                          ))}
                </ul>
            )}
        </div>
    );
};

export default UserSearch;
