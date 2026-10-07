import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "@root/store";
import { CircularProgress, IconButton, Tooltip } from "@mui/material";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Pause from "@mui/icons-material/Pause";
import { useSetConsole } from "@comp/console/context";
import { pauseCsound, resumePausedCsound } from "@comp/csound/actions";
import { saveAllFiles } from "@comp/projects/actions";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import {
    selectPlaybackDocuments,
    selectPlaybackMode,
    selectPlaylistIndex
} from "./selectors";
import { playProject } from "./playback";
import * as SS from "./styles";

export default function PlayButton({
    activeProjectUid,
    isOwner
}: {
    activeProjectUid: string;
    isOwner: boolean;
}) {
    const dispatch = useDispatch();
    const setConsole = useSetConsole();
    const [pending, setPending] = useState(false);
    const request = useRef<AbortController>();
    useEffect(() => {
        setPending(false);
        return () => request.current?.abort();
    }, [activeProjectUid]);
    const status = useSelector((state) => state.csound.status);
    const documents = useSelector((state) =>
        selectPlaybackDocuments(state, activeProjectUid)
    );
    const mode = useSelector((state) =>
        selectPlaybackMode(state, activeProjectUid)
    );
    const index = useSelector((state) =>
        selectPlaylistIndex(state, activeProjectUid)
    );
    const busy = pending || status === "loading" || status === "rendering";
    const label =
        status === "playing"
            ? "Pause playback"
            : status === "paused"
              ? "Resume playback"
              : mode === "playlist"
                ? `Play playlist from ${index + 1}: ${documents[index]?.filename ?? "no track selected"}`
                : `Play ${documents[0]?.filename ?? "project"}`;
    return (
        <Tooltip
            title={
                status === "rendering"
                    ? "Rendering audio"
                    : busy
                      ? "Loading playback"
                      : label
            }
        >
            <span css={SS.buttonContainer} data-testid="run-button">
                <IconButton
                    aria-label={label}
                    data-testid="run-button-native"
                    disabled={busy || !documents.length}
                    onClick={async () => {
                        const controller = new AbortController();
                        request.current = controller;
                        setPending(true);
                        try {
                            if (status === "playing") dispatch(pauseCsound());
                            else if (status === "paused")
                                dispatch(resumePausedCsound());
                            else {
                                if (isOwner) await dispatch(saveAllFiles());
                                if (controller.signal.aborted) return;
                                await playProject(
                                    activeProjectUid,
                                    setConsole,
                                    undefined,
                                    controller.signal
                                );
                            }
                        } catch (error) {
                            if (controller.signal.aborted) return;
                            dispatch(
                                openSnackbar(
                                    error instanceof Error
                                        ? error.message
                                        : "Could not play this project.",
                                    SnackbarType.Error
                                )
                            );
                        } finally {
                            if (request.current === controller)
                                request.current = undefined;
                            if (!controller.signal.aborted) setPending(false);
                        }
                    }}
                >
                    {busy ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : status === "playing" ? (
                        <Pause />
                    ) : (
                        <PlayArrow />
                    )}
                </IconButton>
            </span>
        </Tooltip>
    );
}
