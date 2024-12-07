import React, { useCallback, useRef, useState } from "react";
import { useDispatch } from "@root/store";
import JSZip from "jszip";
import { closeIcon } from "@comp/target-controls/styles";
import { append, equals, last, reject } from "ramda";
import { css, SerializedStyles, Theme } from "@emotion/react";
import { CsoundObj } from "@csound/browser";
import { isAudioFile } from "@comp/projects/utils";
import { closeModal } from "@comp/modal/actions";
import { ReactComponent as WaveFormIcon } from "@root/svgs/fad-waveform.svg";
import { getType as mimeLookup } from "mime";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import Fab from "@mui/material/Fab";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/GetApp";
import PlayIcon from "@mui/icons-material/PlayCircleOutline";
import PauseIcon from "@mui/icons-material/PauseCircleOutline";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import ListItemText from "@mui/material/ListItemText";
import { hr as hrCss } from "@styles/_common";
import { saveAs } from "file-saver";
import {
    CsdFileIcon,
    OrcFileIcon,
    ScoFileIcon,
    UdoFileIcon
} from "@elem/filetype-icons";

const humanizeBytes = (size: number) => {
    const gb = Math.pow(1024, 3);
    const mb = Math.pow(1024, 2);
    const kb = 1024;

    if (size >= gb) {
        return Math.floor(size / gb) + " GB";
    } else if (size >= mb) {
        return Math.floor(size / mb) + " MB";
    } else if (size >= kb) {
        return Math.floor(size / kb) + " KB";
    } else {
        return size + " Bytes";
    }
};

function fixLeadingSlash(filename) {
    return filename.replace(/^\//g, "");
}

function FileTypeIcon({ filename }) {
    const basename = last(filename.split("/")) || "";
    if (basename.endsWith(".csd")) {
        return (
            <span className="rendered-csd-icon">
                <CsdFileIcon />
            </span>
        );
    } else if (basename.endsWith(".orc")) {
        return (
            <span className="rendered-orc-icon">
                <OrcFileIcon />
            </span>
        );
    } else if (basename.endsWith(".sco")) {
        return (
            <span className="rendered-sco-icon">
                <ScoFileIcon />
            </span>
        );
    } else if (basename.endsWith(".udo")) {
        return (
            <span className="rendered-udo-icon">
                <UdoFileIcon />
            </span>
        );
    } else if (isAudioFile(filename)) {
        return (
            <span className="rendered-audio-icon">
                <WaveFormIcon />
            </span>
        );
    } else {
        return (
            <span className="rendered-description-icon">
                <DescriptionIcon />
            </span>
        );
    }
}

const rootStyle = (theme: Theme): SerializedStyles => css`
    background-color: ${theme.background};
    min-width: 480px;
`;

const audioPlayerStyle = (theme: Theme): SerializedStyles => css`
    .player-controls {
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: center;
        left: -15px;
    }

    .player-current-time-pos {
        font-family: ${theme.font.monospace};
        margin-bottom: 2px;
        font-size: 18px;
    }
    .player-seek-container {
        position: relative;
        width: 300px;
        margin: 0 5px;
        height: 5px;
        align-self: center;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
    }
    .player-seek-object {
        position: relative;
        width: 100%;
        height: 100%;
        background-color: #e3e3e3;
        border: 1px solid black;
    }
    .player-seek-percentage {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background-color: coral;
    }
`;

const renderedListStyle = (theme: Theme): SerializedStyles => css`
    height: 48px;
    display: flex;
    justify-content: space-between;
    .rendered-csd-icon,
    .rendered-orc-icon,
    .rendered-sco-icon,
    .rendered-udo-icon {
        & > svg {
            height: 38px;
            width: 36px;
        }
    }

    .rendered-audio-icon {
        width: 32px;
        height: 32px;
        align-self: center;
        svg {
            fill: ${theme.aRateVar};
        }
    }

    .MuiListItemText-root {
        margin: 0 !important;
    }
    p,
    i,
    .MuiListItemText-primary {
        font-size: 18px !important;
        margin: 0 !important;
        margin-left: 12px !important;
        align-self: center;
        margin-left: 12px;
        margin-top: -3px;
        color: ${theme.textColor};
    }
    i {
        font-size: 14px !important;
    }
    .rendered-left {
        display: flex;
        margin-right: 24px;
    }
    .rendered-right {
        display: flex;
    }
`;

function calculateAudioPlayerTimestamp(currentTime) {
    const currentMinute = (currentTime / 60) % 60;
    const currentSecondsLong = currentTime % 60;
    const currentSeconds = currentSecondsLong.toFixed(2);
    const currentTimeFormatted = `${
        currentMinute < 10 ? `0${currentMinute.toFixed(2)}` : currentMinute
    }:${currentSeconds.length < 2 ? `0${currentSeconds}` : currentSeconds}`;
    return currentTimeFormatted;
}

function calculatePercentPlayed(currentTime, duration) {
    return `${((currentTime / duration) * 100).toFixed(2)}%`;
}

function AudioPlayer({
    csound,
    filename,
    currentlyPlaying,
    setCurrentlyPlaying
}) {
    const audioReference: React.RefObject<HTMLAudioElement | null> =
        useRef(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [currentTime, setCurrentTime] = useState("00:00");
    const [percentagePlayed, setPercentagePlayed] = useState("0%");
    const dispatch = useDispatch();
    const mimeType = mimeLookup(filename);

    const onAudioProgress = useCallback(
        (seekTime?: number | any) => {
            if (audioReference && audioReference.current) {
                setCurrentTime(
                    calculateAudioPlayerTimestamp(
                        typeof seekTime === "number"
                            ? seekTime
                            : audioReference.current.currentTime
                    )
                );
                setPercentagePlayed(
                    calculatePercentPlayed(
                        typeof seekTime === "number"
                            ? seekTime
                            : audioReference.current.currentTime,
                        audioReference.current.duration
                    )
                );
            }
        },
        [audioReference, setCurrentTime]
    );

    return (
        <ListItem css={audioPlayerStyle}>
            <ListItemIcon className="player-controls">
                <IconButton
                    data-tip={
                        (!isStarted || isPaused ? "play " : "pause ") + filename
                    }
                    onClick={() => {
                        if (audioReference && audioReference.current) {
                            // counter-intuitively not paused equals to is playing
                            if (isStarted && !audioReference.current.paused) {
                                audioReference.current.pause();
                                setIsPaused(true);
                                return;
                            } else if (
                                isStarted &&
                                audioReference.current.paused
                            ) {
                                setIsPaused(false);
                                audioReference.current.play();
                            }
                            audioReference.current.addEventListener(
                                "timeupdate",
                                onAudioProgress
                            );
                            audioReference.current.onended = () => {
                                audioReference &&
                                    audioReference.current &&
                                    audioReference.current.removeEventListener(
                                        "timeupdate",
                                        onAudioProgress
                                    );
                                setCurrentlyPlaying({});
                                setIsPaused(false);
                                setIsStarted(false);
                            };
                            try {
                                audioReference.current.play();
                            } catch (error) {
                                dispatch(
                                    openSnackbar(
                                        "Failed to play audio file, html5 audio or audio codec is not supported. " +
                                            "(browser support for html5 audio playback can differ). " +
                                            error,
                                        SnackbarType.Error
                                    )
                                );
                            }

                            setCurrentlyPlaying({
                                filename,
                                url: (
                                    window.URL || window.webkitURL
                                ).createObjectURL(
                                    new Blob(
                                        [csound.fs.readFileSync(filename)],
                                        { type: mimeType }
                                    )
                                )
                            });
                            setIsStarted(true);
                        } else {
                            dispatch(
                                openSnackbar(
                                    "Failed to play audio file, html5 audio or audio codec is not supported. " +
                                        "(browser support for html5 audio playback can differ).",
                                    SnackbarType.Error
                                )
                            );
                        }
                    }}
                >
                    {isPaused || !isStarted ? <PlayIcon /> : <PauseIcon />}
                </IconButton>
            </ListItemIcon>
            <audio ref={audioReference}>
                {currentlyPlaying &&
                    currentlyPlaying.filename === filename &&
                    currentlyPlaying.url && (
                        <source
                            src={currentlyPlaying.url}
                            type={mimeType}
                        ></source>
                    )}
            </audio>
            <div style={{ display: "flex" }}>
                <div
                    className="player-seek-container"
                    onClick={(event) => {
                        if (audioReference && audioReference.current) {
                            const seekTime =
                                (event.nativeEvent.offsetX /
                                    event.currentTarget.offsetWidth) *
                                audioReference.current.duration;
                            audioReference.current.currentTime = seekTime;
                            onAudioProgress(seekTime);
                        }
                    }}
                >
                    <div className="player-seek-object">
                        <div
                            style={{ width: percentagePlayed }}
                            className="player-seek-percentage"
                        ></div>
                    </div>
                </div>

                <p>
                    <small className="player-current-time-pos">
                        {currentTime}
                    </small>
                </p>
            </div>
        </ListItem>
    );
}

function RenderModal({
    csound,
    preStartTree
}: {
    csound: CsoundObj;
    preStartTree: Record<string, any>;
}): React.ReactElement {
    const dispatch = useDispatch();
    const allFiles = csound.fs.readdir("/");
    const [selectedFiles, setSelectedFiles] = useState([] as string[]);
    const [currentlyPlaying, setCurrentlyPlaying]: [
        { filename?: string; url?: string },
        any
    ] = useState({});

    const [newFiles, modifiedFiles, nonModifiedFiles] = Object.keys(
        allFiles
    ).reduce(
        ([aNewFiles, aModifiedFiles, aNonModifiedFiles], filename) => {
            if (!Object.keys(preStartTree).includes(filename)) {
                aNewFiles[fixLeadingSlash(filename)] = allFiles[filename];
            } else if (preStartTree[filename] === allFiles[filename].size) {
                aNonModifiedFiles[fixLeadingSlash(filename)] =
                    allFiles[filename];
            } else {
                aModifiedFiles[fixLeadingSlash(filename)] = allFiles[filename];
            }

            return [aNewFiles, aModifiedFiles, aNonModifiedFiles];
        },
        [{}, {}, {}]
    );

    return (
        <div>
            <Fab
                onClick={() => {
                    dispatch(closeModal());
                    for (const newFile of Object.keys(newFiles)) {
                        csound.fs.unlink(newFile);
                    }
                    csound.terminateInstance();
                }}
                css={closeIcon}
                data-tip={
                    "Did you remember to download all the generated files?\n" +
                    "Closing will remove all temporary files (until you render again)"
                }
                color="secondary"
                variant="circular"
                size="small"
            >
                <CloseIcon />
            </Fab>
            {[
                { type: "new", data: newFiles },
                { type: "mod", data: modifiedFiles },
                { type: "old", data: nonModifiedFiles }
            ]
                .filter((maybeData) => Object.keys(maybeData.data).length > 0)
                .map(({ type, data }) => (
                    <div key={type}>
                        <h1>
                            {type === "new"
                                ? "Generated files"
                                : type === "mod"
                                  ? "Files changed after render"
                                  : "Unmodified files"}
                        </h1>
                        <List css={rootStyle}>
                            {Object.keys(data).map((filename) => {
                                return (
                                    <React.Fragment key={filename}>
                                        <ListItem
                                            css={renderedListStyle}
                                            onClick={() =>
                                                setSelectedFiles(
                                                    selectedFiles.includes(
                                                        filename
                                                    )
                                                        ? reject(
                                                              equals(filename),
                                                              selectedFiles
                                                          )
                                                        : append(
                                                              filename,
                                                              selectedFiles
                                                          )
                                                )
                                            }
                                            role={undefined}
                                            dense
                                        >
                                            <div className="rendered-left">
                                                <ListItemIcon>
                                                    <Checkbox
                                                        edge="start"
                                                        checked={selectedFiles.includes(
                                                            filename
                                                        )}
                                                        tabIndex={-1}
                                                        disableRipple
                                                    />
                                                </ListItemIcon>
                                                <FileTypeIcon
                                                    filename={filename}
                                                />
                                                <div>
                                                    <ListItemText
                                                        primary={filename}
                                                    />
                                                    <i>
                                                        {humanizeBytes(
                                                            data[filename]
                                                                .size as number
                                                        )}
                                                    </i>
                                                </div>
                                            </div>
                                            <ListItemSecondaryAction className="rendered-right">
                                                <IconButton
                                                    aria-label={
                                                        "download " + filename
                                                    }
                                                    data-tip={
                                                        "download " + filename
                                                    }
                                                    onClick={async () =>
                                                        saveAs(
                                                            new Blob([
                                                                await csound.fs.readFile(
                                                                    filename
                                                                )
                                                            ]),
                                                            last(
                                                                filename.split(
                                                                    "/"
                                                                )
                                                            )
                                                        )
                                                    }
                                                >
                                                    <DownloadIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        {isAudioFile(filename) && (
                                            <AudioPlayer
                                                csound={csound}
                                                filename={filename}
                                                currentlyPlaying={
                                                    currentlyPlaying
                                                }
                                                setCurrentlyPlaying={
                                                    setCurrentlyPlaying
                                                }
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    </div>
                ))}

            {selectedFiles.length > 0 && (
                <>
                    <hr
                        style={{ marginTop: 12, marginBottom: 24 }}
                        css={hrCss}
                    />
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={async () => {
                            const bundle = new JSZip();
                            for (const filename of selectedFiles) {
                                const arrayBuffer =
                                    await csound.fs.readFile(filename);
                                bundle.file(filename, arrayBuffer);
                            }

                            saveAs(
                                await bundle.generateAsync({ type: "blob" }),
                                "project.zip"
                            );
                        }}
                    >
                        Export selected files as zip
                        {`(${selectedFiles.length})`}
                    </Button>
                </>
            )}
        </div>
    );
}

export default RenderModal;
