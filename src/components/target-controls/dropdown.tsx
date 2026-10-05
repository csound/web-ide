import { useSyncExternalStore } from "react";
import { projectPlayback, subscribeProjectPlayback } from "./playback";
import {
    IconButton,
    MenuItem,
    Select,
    Tooltip,
    useMediaQuery
} from "@mui/material";
import TuneRounded from "@mui/icons-material/TuneRounded";
import QueueMusicRounded from "@mui/icons-material/QueueMusicRounded";
import { useDispatch, useSelector } from "@root/store";
import { setPlaylistIndex, showTargetsConfigDialog } from "./actions";
import {
    selectPlaybackDocuments,
    selectPlaybackMode,
    selectPlaylistIndex
} from "./selectors";
import { selectIsOwnerForProject } from "@comp/project-editor/selectors";
import { documentPath } from "@comp/csound/actions";

export default function TargetDropdown({
    activeProjectUid
}: {
    activeProjectUid: string;
}) {
    const dispatch = useDispatch();
    const narrow = useMediaQuery("(max-width:600px)");
    const isOwner = useSelector(selectIsOwnerForProject(activeProjectUid));
    const mode = useSelector((state) =>
        selectPlaybackMode(state, activeProjectUid)
    );
    const documents = useSelector((state) =>
        selectPlaybackDocuments(state, activeProjectUid)
    );
    const allDocuments = useSelector(
        (state) =>
            state.ProjectsReducer.projects[activeProjectUid]?.documents ?? {}
    );
    const selectedIndex = useSelector((state) =>
        selectPlaylistIndex(state, activeProjectUid)
    );
    const current = useSyncExternalStore(
        subscribeProjectPlayback,
        projectPlayback
    );
    const currentIndex =
        current?.projectUid === activeProjectUid
            ? documents.findIndex(
                  (document) => document.documentUid === current.documentUid
              )
            : -1;
    const index = currentIndex >= 0 ? currentIndex : selectedIndex;
    const status = useSelector((state) => state.csound.status);
    const busy = ["loading", "playing", "paused", "rendering"].includes(status);
    if (mode === "main" && !isOwner) return null;
    return (
        <div
            css={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}
        >
            {mode === "playlist" && (
                <Select
                    size="small"
                    value={documents.length ? index : ""}
                    disabled={
                        busy || (!documents.length && !(isOwner && narrow))
                    }
                    displayEmpty
                    inputProps={{
                        "aria-label": busy
                            ? "Current playlist track"
                            : "Start playlist from"
                    }}
                    onChange={(event) => {
                        if (event.target.value === "configure")
                            dispatch(showTargetsConfigDialog());
                        else
                            dispatch(
                                setPlaylistIndex(
                                    activeProjectUid,
                                    Number(event.target.value)
                                )
                            );
                    }}
                    renderValue={() => (
                        <span
                            css={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                minWidth: 0
                            }}
                        >
                            <QueueMusicRounded
                                fontSize="small"
                                css={{
                                    "@media(max-width:600px)": {
                                        display: "none"
                                    }
                                }}
                            />
                            <span
                                css={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis"
                                }}
                            >
                                {documents.length ? (
                                    <>
                                        {index + 1}/{documents.length}
                                        <span
                                            css={{
                                                "@media(max-width:600px)": {
                                                    display: "none"
                                                }
                                            }}
                                        >
                                            {" "}
                                            · {documents[index].filename}
                                        </span>
                                    </>
                                ) : (
                                    "Empty playlist"
                                )}
                            </span>
                        </span>
                    )}
                    css={(theme) => ({
                        width: "clamp(120px, 24vw, 280px)",
                        "@media(max-width:600px)": { width: 72 },
                        "@media(max-width:380px)": {
                            width: 64,
                            height: 36,
                            ".MuiSelect-select": { paddingLeft: 8 }
                        },
                        height: 42,
                        color: theme.textColor,
                        fontSize: 13,
                        ".MuiSelect-select.Mui-disabled": {
                            WebkitTextFillColor: theme.textColor,
                            opacity: 0.8
                        }
                    })}
                >
                    {isOwner && narrow && (
                        <MenuItem value="configure">Playback settings</MenuItem>
                    )}
                    {documents.map((document, position) => (
                        <MenuItem key={document.documentUid} value={position}>
                            {position + 1}.{" "}
                            {documentPath(document, allDocuments)}
                        </MenuItem>
                    ))}
                </Select>
            )}
            {isOwner && !(mode === "playlist" && narrow) && (
                <Tooltip title="Playback settings">
                    <IconButton
                        aria-label="Playback settings"
                        onClick={() => dispatch(showTargetsConfigDialog())}
                    >
                        <TuneRounded fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </div>
    );
}
