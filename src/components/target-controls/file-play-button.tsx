import { useState, useSyncExternalStore } from "react";
import { Button, Tooltip } from "@mui/material";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import StopRounded from "@mui/icons-material/StopRounded";
import { useDispatch, useSelector } from "@root/store";
import { useSetConsole } from "@comp/console/context";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import { selectPlaybackDocuments, selectPlaybackMode } from "./selectors";
import {
    playProject,
    projectPlayback,
    stopProjectPlayback,
    subscribeProjectPlayback
} from "./playback";

export function FilePlayButton({
    projectUid,
    documentUid,
    compact = true
}: {
    projectUid: string;
    documentUid: string;
    compact?: boolean;
}) {
    const dispatch = useDispatch();
    const setConsole = useSetConsole();
    const current = useSyncExternalStore(
        subscribeProjectPlayback,
        projectPlayback
    );
    const status = useSelector((state) => state.csound.status);
    const documents = useSelector((state) =>
        selectPlaybackDocuments(state, projectUid)
    );
    const mode = useSelector((state) => selectPlaybackMode(state, projectUid));
    const [pending, setPending] = useState(false);
    const index = documents.findIndex(
        (document) => document.documentUid === documentUid
    );
    if (mode !== "playlist" || index < 0) return null;
    const playing =
        current?.projectUid === projectUid &&
        current.documentUid === documentUid;
    const busy =
        pending ||
        ["playing", "paused", "loading", "rendering"].includes(status);
    const label = playing
        ? `Stop ${documents[index].filename}`
        : `Play only ${documents[index].filename}`;
    return (
        <Tooltip title={label}>
            <span css={{ display: "inline-flex", flexShrink: 0 }}>
                <Button
                    aria-label={label}
                    size="small"
                    disabled={!playing && busy}
                    css={(theme) => ({
                        color: playing
                            ? theme.tabHighlightActive
                            : theme.altTextColor,
                        ...(compact
                            ? {
                                  width: 28,
                                  height: 28,
                                  minWidth: 28,
                                  padding: 0,
                                  marginRight: 4
                              }
                            : { gap: 4, textTransform: "none" }),
                        "&:focus-visible": {
                            outline: `2px solid ${theme.tabHighlightActive}`,
                            outlineOffset: -2
                        }
                    })}
                    onPointerDown={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    onClick={async (event) => {
                        event.stopPropagation();
                        if (playing) {
                            stopProjectPlayback(projectUid);
                            return;
                        }
                        setPending(true);
                        try {
                            await playProject(
                                projectUid,
                                setConsole,
                                documentUid
                            );
                        } catch (error) {
                            dispatch(
                                openSnackbar(
                                    error instanceof Error
                                        ? error.message
                                        : "Could not play this file.",
                                    SnackbarType.Error
                                )
                            );
                        } finally {
                            setPending(false);
                        }
                    }}
                >
                    {playing ? (
                        <StopRounded fontSize="small" />
                    ) : (
                        <PlayArrowRounded fontSize="small" />
                    )}
                    {!compact &&
                        (playing
                            ? "Stop this file"
                            : `Play track ${index + 1}`)}
                </Button>
            </span>
        </Tooltip>
    );
}
