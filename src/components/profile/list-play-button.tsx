import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "@root/store";
import { playListItem } from "./actions";
import { selectCsoundStatus } from "@comp/csound/selectors";
import { pauseCsound, resumePausedCsound } from "@comp/csound/actions";
import { selectCurrentlyPlayingProject } from "./selectors";
import AlertIcon from "@mui/icons-material/ErrorOutline";
import { Theme, useTheme } from "@emotion/react";
import ProjectAvatar from "@elem/project-avatar";
import * as SS from "./styles";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";

const SvgPlayIcon = ({
    shouldDisplay,
    theme
}: {
    shouldDisplay: boolean;
    theme: Theme;
}) => {
    return (
        <svg
            x={0}
            y={0}
            className={"listPlayIcon"}
            style={{
                width: "calc(100% - 24px)",
                height: "calc(100% - 24px)",
                position: "absolute",
                right: 12,
                fill: (theme as any).allowed,
                display: shouldDisplay ? "inherit" : "none"
            }}
            enableBackground="new 0 0 58.752 58.752"
            viewBox="0 0 58.752 58.752"
            xmlSpace="preserve"
        >
            <path d="M52.524 23.925L12.507.824c-1.907-1.1-4.376-1.097-6.276 0a6.294 6.294 0 00-3.143 5.44v46.205a6.29 6.29 0 003.131 5.435 6.263 6.263 0 006.29.005l40.017-23.103a6.3 6.3 0 003.138-5.439 6.315 6.315 0 00-3.14-5.442zm-3 5.687L9.504 52.716a.27.27 0 01-.279-.005.28.28 0 01-.137-.242V6.263a.28.28 0 01.421-.243l40.01 23.098a.29.29 0 01.145.249.283.283 0 01-.14.245z"></path>
        </svg>
    );
};

export const ListPlayButton = ({
    projectUid,
    projectName,
    size = 64,
    iconName,
    iconBackgroundColor,
    iconForegroundColor
}: {
    projectUid: string;
    projectName: string;
    size?: number;
    iconName?: string;
    iconBackgroundColor?: string;
    iconForegroundColor?: string;
}) => {
    const theme: any = useTheme();
    const currentlyPlayingProject = useSelector(selectCurrentlyPlayingProject);
    const csoundStatus = useSelector(selectCsoundStatus);

    const isPlaying = currentlyPlayingProject === projectUid;
    const hasError = isPlaying && csoundStatus === "error";
    const isPaused = isPlaying && csoundStatus === "paused";
    const isStop = csoundStatus === "stopped";
    const [isStartingUp, setIsStartingUp] = useState(false);
    const dispatch = useDispatch();

    const request = useRef<AbortController>();
    useEffect(() => {
        setIsStartingUp(false);
        return () => request.current?.abort();
    }, [projectUid]);
    const isAudible = isPlaying && csoundStatus === "playing";

    const buttonCallback = useCallback(async () => {
        if (isStartingUp) return;
        if (isPaused) {
            dispatch(resumePausedCsound());
            return;
        }
        if (isAudible) {
            dispatch(pauseCsound());
            return;
        }
        const controller = new AbortController();
        request.current = controller;
        setIsStartingUp(true);
        try {
            await dispatch(
                playListItem({ projectUid, signal: controller.signal })
            );
        } catch (error) {
            dispatch(
                openSnackbar(
                    error instanceof Error
                        ? error.message
                        : "Could not play this project.",
                    SnackbarType.Error
                )
            );
        } finally {
            if (request.current === controller) request.current = undefined;
            if (!controller.signal.aborted) setIsStartingUp(false);
        }
    }, [dispatch, isPaused, isAudible, isStartingUp, projectUid]);

    const IconComponent = (
        <ProjectAvatar
            iconName={iconName}
            iconBackgroundColor={iconBackgroundColor}
            iconForegroundColor={iconForegroundColor}
        />
    );

    return (
        <SS.StyledAvatar
            component="button"
            size={size}
            type="button"
            aria-label={
                isStartingUp
                    ? `Starting ${projectName}`
                    : isAudible
                      ? `Pause ${projectName}`
                      : `Play ${projectName}`
            }
            aria-busy={isStartingUp}
            isPlaying={isPlaying}
            isPaused={isPaused}
            isStop={isStop}
            isStartingUp={isStartingUp}
            hasError={hasError}
            iconBackgroundColorProp={iconBackgroundColor}
            onClick={buttonCallback}
        >
            <>
                {IconComponent}

                <SvgPlayIcon
                    shouldDisplay={
                        (isPaused || isStop || !isPlaying) &&
                        !isStartingUp &&
                        !hasError
                    }
                    theme={theme}
                />
                <AlertIcon
                    className={"projectIcon"}
                    style={{
                        fill: "white",
                        fontSize: 40,
                        display: hasError ? "inherit" : "none"
                    }}
                    fontSize="large"
                    color="error"
                />
                <span
                    css={SS.loadingSpinner}
                    style={{
                        display: isStartingUp ? "inherit" : "none"
                    }}
                >
                    <span />
                    <span />
                </span>
                <span
                    style={{
                        display: isAudible ? "inherit" : "none"
                    }}
                    css={SS.pauseIcon}
                />
            </>
        </SS.StyledAvatar>
    );
};
