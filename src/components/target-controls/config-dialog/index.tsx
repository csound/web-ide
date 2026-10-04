import { useState } from "react";
import { useTheme } from "@emotion/react";
import {
    Button,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip
} from "@mui/material";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import QueueMusicRounded from "@mui/icons-material/QueueMusicRounded";
import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRounded from "@mui/icons-material/ArrowDownwardRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import Select from "react-select";
import { useDispatch, useSelector } from "@root/store";
import { closeModal } from "@comp/modal/actions";
import { documentPath } from "@comp/csound/actions";
import { saveChangesToTarget } from "../actions";
import { isPlayableDocument, playbackDocuments, projectTarget } from "../model";
import { reactSelectDropdownStyle } from "../styles";
import * as styles from "./styles";

export const TargetControlsConfigDialog = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const projectUid =
        useSelector((state) => state.ProjectsReducer.activeProjectUid) ?? "";
    const documents =
        useSelector(
            (state) => state.ProjectsReducer.projects[projectUid]?.documents
        ) ?? {};
    const controls = useSelector(
        (state) => state.TargetControlsReducer[projectUid]
    );
    const status = useSelector((state) => state.csound.status);
    const target = projectTarget(controls);
    const [mode, setMode] = useState(
        target?.targetType === "playlist" ? "playlist" : "main"
    );
    const [main, setMain] = useState(
        playbackDocuments(controls, documents)[0]?.documentUid ?? ""
    );
    const [playlist, setPlaylist] = useState([
        ...new Set(
            target?.targetType === "playlist"
                ? (target.playlistDocumentsUid ?? [])
                : []
        )
    ]);
    const [saving, setSaving] = useState(false);
    const [announcement, setAnnouncement] = useState("");
    const busy = ["loading", "playing", "paused", "rendering"].includes(status);
    const options = Object.values(documents)
        .filter(isPlayableDocument)
        .map((document) => ({
            value: document.documentUid,
            label: documentPath(document, documents)
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    const valid =
        mode === "main"
            ? options.some((option) => option.value === main)
            : playlist.length > 0 &&
              playlist.every((uid) =>
                  options.some((option) => option.value === uid)
              );
    const reorder = (index: number, direction: number) => {
        const next = [...playlist];
        [next[index], next[index + direction]] = [
            next[index + direction],
            next[index]
        ];
        setPlaylist(next);
        setAnnouncement(
            `${documents[playlist[index]]?.filename} moved to position ${index + direction + 1}.`
        );
    };
    const selectStyles = reactSelectDropdownStyle(theme);
    return (
        <div
            css={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="playback-settings-title"
        >
            <header css={styles.header}>
                <div>
                    <h2 id="playback-settings-title">Playback settings</h2>
                    <p>Choose what the play button starts.</p>
                </div>
                <IconButton
                    aria-label="Close playback settings"
                    disabled={saving}
                    onClick={() => dispatch(closeModal())}
                >
                    <CloseRounded />
                </IconButton>
            </header>
            <ToggleButtonGroup
                exclusive
                value={mode}
                aria-label="Project playback mode"
                disabled={saving}
                onChange={(_event, next: string | null) => {
                    if (next) setMode(next);
                }}
                css={styles.modeSwitch}
            >
                <ToggleButton value="main">
                    <PlayArrowRounded />
                    Main file
                </ToggleButton>
                <ToggleButton value="playlist">
                    <QueueMusicRounded />
                    Playlist
                </ToggleButton>
            </ToggleButtonGroup>
            <section css={styles.body}>
                {mode === "main" ? (
                    <>
                        <label htmlFor="main-playback-file" css={styles.label}>
                            Main file
                        </label>
                        <p css={styles.help}>
                            One CSD or ORC file starts this project.
                        </p>
                        <Select
                            inputId="main-playback-file"
                            options={options}
                            value={
                                options.find(
                                    (option) => option.value === main
                                ) ?? null
                            }
                            onChange={(option) => setMain(option?.value ?? "")}
                            placeholder="Choose a file…"
                            isDisabled={saving}
                            styles={selectStyles}
                            menuPosition="fixed"
                            menuPortalTarget={document.body}
                        />
                    </>
                ) : (
                    <>
                        <div css={styles.listHeading}>
                            <h3>Playing order</h3>
                            <span>
                                {playlist.length}{" "}
                                {playlist.length === 1 ? "track" : "tracks"}
                            </span>
                        </div>
                        <p css={styles.help}>
                            Play from any track to the end. Use a tab’s play
                            button to hear just that file.
                        </p>
                        {playlist.length ? (
                            <ol
                                css={styles.trackList}
                                aria-label="Playlist order"
                            >
                                {playlist.map((uid, index) => {
                                    const file = documents[uid];
                                    const label = file
                                        ? documentPath(file, documents)
                                        : "Missing file";
                                    return (
                                        <li key={uid}>
                                            <span css={styles.number}>
                                                {index + 1}
                                            </span>
                                            <span
                                                css={styles.trackName}
                                                title={label}
                                            >
                                                {label}
                                            </span>
                                            <div css={styles.trackActions}>
                                                <Tooltip title="Move up">
                                                    <span>
                                                        <IconButton
                                                            aria-label={`Move ${label} up`}
                                                            size="small"
                                                            disabled={
                                                                saving ||
                                                                index === 0
                                                            }
                                                            onClick={() =>
                                                                reorder(
                                                                    index,
                                                                    -1
                                                                )
                                                            }
                                                        >
                                                            <ArrowUpwardRounded fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Move down">
                                                    <span>
                                                        <IconButton
                                                            aria-label={`Move ${label} down`}
                                                            size="small"
                                                            disabled={
                                                                saving ||
                                                                index ===
                                                                    playlist.length -
                                                                        1
                                                            }
                                                            onClick={() =>
                                                                reorder(
                                                                    index,
                                                                    1
                                                                )
                                                            }
                                                        >
                                                            <ArrowDownwardRounded fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Remove from playlist">
                                                    <IconButton
                                                        aria-label={`Remove ${label} from playlist`}
                                                        size="small"
                                                        disabled={saving}
                                                        onClick={() =>
                                                            setPlaylist(
                                                                playlist.filter(
                                                                    (entry) =>
                                                                        entry !==
                                                                        uid
                                                                )
                                                            )
                                                        }
                                                    >
                                                        <CloseRounded fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        ) : (
                            <div css={styles.empty}>
                                <QueueMusicRounded />
                                <span>Add the first track below.</span>
                            </div>
                        )}
                        <label htmlFor="playlist-add-file" css={styles.label}>
                            Add a track
                        </label>
                        <Select
                            inputId="playlist-add-file"
                            value={null}
                            options={options.filter(
                                (option) => !playlist.includes(option.value)
                            )}
                            onChange={(option) => {
                                if (option) {
                                    setPlaylist([...playlist, option.value]);
                                    setAnnouncement(
                                        `${option.label} added to the playlist.`
                                    );
                                }
                            }}
                            placeholder="Find a CSD or ORC file…"
                            isDisabled={saving}
                            styles={selectStyles}
                            noOptionsMessage={() => "No more playable files"}
                            menuPosition="fixed"
                            menuPortalTarget={document.body}
                        />
                    </>
                )}
                {!options.length && (
                    <p css={styles.help}>
                        Add a .csd or .orc file to the project to set up
                        playback.
                    </p>
                )}
                {Object.keys(controls?.targets ?? {}).length > 1 && (
                    <p css={styles.help}>
                        Saving replaces the old targets with this{" "}
                        {mode === "main" ? "main file" : "playlist"}. Project
                        files stay in place.
                    </p>
                )}
                {busy && (
                    <p css={styles.help}>
                        Stop playback before saving changes.
                    </p>
                )}
                <span aria-live="polite" css={styles.srOnly}>
                    {announcement}
                </span>
            </section>
            <footer css={styles.footer}>
                <Button
                    disabled={saving}
                    onClick={() => dispatch(closeModal())}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    disabled={!valid || saving || busy}
                    onClick={async () => {
                        setSaving(true);
                        const name = mode === "main" ? "Main" : "Playlist";
                        try {
                            await dispatch(
                                saveChangesToTarget(
                                    projectUid,
                                    {
                                        [name]: {
                                            targetName: name,
                                            targetType: mode,
                                            csoundOptions:
                                                target?.csoundOptions ?? {},
                                            ...(mode === "main"
                                                ? { targetDocumentUid: main }
                                                : {
                                                      playlistDocumentsUid:
                                                          playlist
                                                  })
                                        }
                                    },
                                    name,
                                    () => dispatch(closeModal())
                                )
                            );
                        } finally {
                            setSaving(false);
                        }
                    }}
                >
                    {saving ? "Saving…" : "Save changes"}
                </Button>
            </footer>
        </div>
    );
};
