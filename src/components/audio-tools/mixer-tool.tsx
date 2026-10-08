import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@emotion/react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import TuneRounded from "@mui/icons-material/TuneRounded";
import { durationOf } from "./audio";
import type { AudioSource } from "./audio-tool";
import { AudioSelect } from "./audio-select";
import { EditList } from "./edit-list";
import { readAudioStream } from "./limits";
import { MixTimeline } from "./mix-timeline";
import {
    buildMix,
    checkMixSize,
    MAX_MIX_TRACKS,
    prepareMixAudio,
    routes,
    trackDefaults,
    type MixTrack
} from "./mixer";
import { useAudioUrl } from "./use-audio-url";
import { useDebouncedTask } from "./use-debounced-task";
import { WavePlayer } from "./wave-player";
import type { ToolFile } from "./types";

/** Arrange audio visually and render one debounced mix from unchanged source files. */
export default function MixerTool({
    sources = [],
    onSave
}: {
    sources?: AudioSource[];
    onSave: (file: ToolFile) => string;
}) {
    const theme = useTheme();
    const [tracks, setTracks] = useState<MixTrack[]>([]);
    const [gain, setGain] = useState(0);
    const [loading, setLoading] = useState("");
    const [error, setError] = useState("");
    const [saved, setSaved] = useState<{ file: ToolFile; name: string }>();
    const input = useRef<HTMLInputElement>(null);
    const job = useRef<AbortController>();
    const nextId = useRef(0);
    const request = useMemo(
        () => (tracks.length && !loading ? { tracks, gain } : undefined),
        [tracks, gain, loading]
    );
    const preview = useDebouncedTask(request, buildMix);
    const result = preview.value;
    // Keep transport volume and mute state while an updated mix is rendering.
    const [lastResult, setLastResult] = useState<typeof result>();
    useEffect(() => {
        if (result) setLastResult(result);
        else if (!tracks.length) setLastResult(undefined);
    }, [result, tracks.length]);
    const displayed = result || lastResult;
    const url = useAudioUrl(displayed?.data);
    const problem = error || preview.error;
    const busy = Boolean(loading || preview.pending);
    const anySolo = tracks.some((track) => track.solo);
    const end = Math.max(
        0,
        ...tracks.map(
            (track) =>
                (Number.isFinite(track.start) ? track.start : 0) +
                durationOf(track.audio)
        )
    );
    const span = Math.max(2, end * 1.2);
    useEffect(() => () => job.current?.abort(), []);
    const update = (id: string, settings: Partial<typeof trackDefaults>) => {
        setError("");
        setTracks((current) =>
            current.map((track) =>
                track.id === id ? { ...track, ...settings } : track
            )
        );
    };
    const reset = () => {
        setTracks((current) =>
            current.map((track) => ({ ...track, ...trackDefaults }))
        );
        setGain(0);
        setError("");
    };
    const cancelLoad = () => {
        job.current?.abort();
        setLoading("");
    };
    const load = async (files: AudioSource[]) => {
        if (!files.length || loading) return;
        if (tracks.length + files.length > MAX_MIX_TRACKS) {
            setError(`Use up to ${MAX_MIX_TRACKS} tracks per mix.`);
            return;
        }
        job.current?.abort();
        const controller = new AbortController();
        job.current = controller;
        setError("");
        const status = (text: string) => {
            if (!controller.signal.aborted) setLoading(text);
        };
        status("Reading audio…");
        try {
            const added: MixTrack[] = [];
            let rate = tracks[0]?.audio.sampleRate;
            for (const source of files) {
                status(`Reading ${source.name}…`);
                const bytes = await source.load(controller.signal);
                controller.signal.throwIfAborted();
                const prepared = await prepareMixAudio(
                    bytes,
                    rate,
                    controller.signal,
                    status
                );
                rate ??= prepared.audio.sampleRate;
                added.push({
                    ...trackDefaults,
                    ...prepared,
                    id: String(++nextId.current),
                    name: source.name
                });
                checkMixSize([...tracks, ...added]);
            }
            controller.signal.throwIfAborted();
            setTracks((current) => [...current, ...added]);
        } catch (cause) {
            if (!controller.signal.aborted)
                setError(
                    cause instanceof Error
                        ? cause.message
                        : "Could not add this audio."
                );
        } finally {
            if (!controller.signal.aborted) setLoading("");
        }
    };
    const upload = (files: File[]) =>
        void load(
            files.map((file) => ({
                id: file.name,
                name: file.name,
                load: (signal) =>
                    readAudioStream(file.stream(), signal, file.size)
            }))
        );
    const rows = tracks.flatMap((track) => {
        const settings = [
            {
                key: "start",
                label: "Start",
                detail: `${track.start.toFixed(2)} s`
            },
            { key: "gain", label: "Gain", detail: `${track.gain} dB` },
            { key: "route", label: "Channels", detail: routes[track.route] },
            { key: "muted", label: "Mute", detail: "Muted" },
            {
                key: "solo",
                label: "Solo",
                detail: "Only solo tracks are included"
            }
        ] as const;
        return settings
            .filter(({ key }) => track[key] !== trackDefaults[key])
            .map(({ key, label, detail }) => ({
                id: `${track.id}-${key}`,
                label: `${track.name}: ${label}`,
                detail,
                remove: () => update(track.id, { [key]: trackDefaults[key] })
            }));
    });
    if (gain !== 0)
        rows.push({
            id: "output",
            label: "Output gain",
            detail: `${gain} dB`,
            remove: () => setGain(0)
        });
    const exportReady = Boolean(result && !busy && !preview.error);
    const download = () => {
        if (!result || !exportReady) return;
        const href = URL.createObjectURL(
            new Blob([result.data], { type: "audio/wav" })
        );
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.download = result.name;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(href), 1000);
    };
    return (
        <section
            aria-label="Mixer"
            aria-busy={busy}
            data-local-file-drop
            onDragOver={(event) => {
                if (event.dataTransfer.types.includes("Files")) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }}
            onDrop={(event) => {
                if (event.dataTransfer.files.length) {
                    event.preventDefault();
                    event.stopPropagation();
                    upload(Array.from(event.dataTransfer.files));
                }
            }}
            css={{
                height: "100%",
                minHeight: 0,
                overflow: "auto",
                containerType: "inline-size",
                background: theme.background,
                color: theme.textColor,
                fontFamily: theme.font.regular,
                "& button": {
                    fontFamily: "inherit",
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    fontSize: 12,
                    borderRadius: 4
                },
                "& button:focus-visible, & input:focus-visible, & select:focus-visible, & [role=slider]:focus-visible":
                    {
                        outline: `2px solid ${theme.textColor}`,
                        outlineOffset: 2
                    },
                "& .MuiButton-root, & .MuiIconButton-root": {
                    color: theme.textColor,
                    borderColor: theme.line
                },
                "& .MuiButton-root": { minHeight: 32 },
                "& button:hover": { background: theme.buttonBackgroundHover },
                "& button:active": { transform: "scale(0.98)" },
                "& button.Mui-disabled": { color: theme.disabledTextColor },
                "& button[aria-pressed=true]": {
                    background: theme.highlightBackgroundAlt,
                    borderColor: theme.tabHighlightActive
                },
                "& label": {
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    minWidth: 0,
                    fontSize: 12
                },
                "& input, & select": {
                    boxSizing: "border-box",
                    minWidth: 0,
                    width: "100%",
                    padding: "7px 8px",
                    font: "inherit",
                    fontSize: 12,
                    border: `1px solid ${theme.line}`,
                    borderRadius: 4,
                    background: theme.textFieldBackground,
                    color: theme.textColor
                },
                "& input[type=range]": {
                    padding: 0,
                    border: 0,
                    height: 28,
                    accentColor: theme.tabHighlightActive
                },
                "& input[type=number], & output": {
                    fontFamily: theme.font.monospace
                },
                "& p": { fontSize: 12, lineHeight: 1.5, margin: 0 },
                "@media (prefers-reduced-motion: reduce)": {
                    "& .MuiLinearProgress-bar": { animation: "none" }
                },
                "@container (max-width: 520px)": {
                    "& .mix-track": { gridTemplateColumns: "minmax(0, 1fr)" },
                    "& .mix-settings": {
                        gridTemplateColumns: "90px minmax(0, 1fr)"
                    },
                    "& .mix-route": { gridColumn: "1 / -1" },
                    "& .mix-ruler": { marginLeft: 0 },
                    "& [aria-label=Changes] li": { flexWrap: "wrap" }
                }
            }}
        >
            <div css={{ position: "sticky", top: 0, height: 4, zIndex: 2 }}>
                {busy && (
                    <LinearProgress
                        aria-label={loading || preview.status}
                        css={{
                            background: theme.line,
                            "& .MuiLinearProgress-bar": {
                                background: theme.tabHighlightActive
                            }
                        }}
                    />
                )}
            </div>
            <div css={{ padding: 16, display: "grid", gap: 16 }}>
                <header
                    css={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap"
                    }}
                >
                    <div
                        css={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            marginRight: "auto"
                        }}
                    >
                        <TuneRounded fontSize="small" />
                        <strong css={{ fontSize: 14 }}>Mixer</strong>
                    </div>
                    <label css={{ flex: "1 1 180px", maxWidth: 300 }}>
                        Project audio
                        <AudioSelect
                            aria-label="Project audio file"
                            value=""
                            disabled={
                                Boolean(loading) ||
                                tracks.length >= MAX_MIX_TRACKS
                            }
                            onChange={(event) => {
                                const source = sources.find(
                                    (item) => item.id === event.target.value
                                );
                                if (source) void load([source]);
                            }}
                        >
                            <option value="">Add a project file…</option>
                            {sources.map((source) => (
                                <option key={source.id} value={source.id}>
                                    {source.name}
                                </option>
                            ))}
                        </AudioSelect>
                    </label>
                    <Button
                        variant="outlined"
                        startIcon={<UploadFileRounded />}
                        disabled={
                            Boolean(loading) || tracks.length >= MAX_MIX_TRACKS
                        }
                        onClick={() => input.current?.click()}
                    >
                        Add audio
                    </Button>
                    <input
                        ref={input}
                        type="file"
                        aria-label="Add audio files"
                        accept="audio/*,.wav,.aif,.aiff,.flac"
                        multiple
                        hidden
                        onChange={(event) => {
                            upload(Array.from(event.target.files || []));
                            event.target.value = "";
                        }}
                    />
                </header>
                {loading && (
                    <div
                        role="status"
                        css={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                        <p css={{ flex: 1 }}>{loading}</p>
                        <Button onClick={cancelLoad}>Cancel</Button>
                    </div>
                )}
                {problem && (
                    <div
                        role="alert"
                        css={{
                            borderLeft: `3px solid ${theme.errorText}`,
                            padding: "8px 12px"
                        }}
                    >
                        <p>{problem}</p>
                        {preview.error && (
                            <Button onClick={preview.retry}>Retry</Button>
                        )}
                    </div>
                )}
                {!tracks.length ? (
                    <div
                        css={{
                            padding: "36px 12px",
                            textAlign: "center",
                            border: `1px dashed ${theme.line}`,
                            borderRadius: 4
                        }}
                    >
                        <TuneRounded
                            css={{
                                fontSize: 32,
                                color: theme.altTextColor,
                                marginBottom: 12
                            }}
                        />
                        <p>
                            <strong>Start with a few sounds</strong>
                        </p>
                        <p
                            css={{
                                marginTop: "6px !important",
                                color: theme.altTextColor
                            }}
                        >
                            Drop audio here, add files, or choose from your
                            project.
                        </p>
                    </div>
                ) : (
                    <>
                        <p css={{ color: theme.altTextColor }}>
                            Drag clips to set their start time. Changes update
                            the mix automatically.
                        </p>
                        <div>
                            <div
                                className="mix-ruler"
                                aria-hidden
                                css={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginLeft: 156,
                                    fontFamily: theme.font.monospace,
                                    fontSize: 10,
                                    color: theme.altTextColor,
                                    marginBottom: 6
                                }}
                            >
                                {[0, 1, 2, 3, 4].map((tick) => (
                                    <span key={tick}>
                                        {((span * tick) / 4).toFixed(2)} s
                                    </span>
                                ))}
                            </div>
                            <ol
                                aria-label="Mix tracks"
                                css={{
                                    listStyle: "none",
                                    margin: 0,
                                    padding: 0,
                                    display: "grid",
                                    gap: 16
                                }}
                            >
                                {tracks.map((track, index) => (
                                    <li
                                        key={track.id}
                                        className="mix-track"
                                        css={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "140px minmax(0, 1fr)",
                                            gap: 16,
                                            borderBottom: `1px solid ${theme.line}`,
                                            paddingBottom: 16
                                        }}
                                    >
                                        <div>
                                            <div
                                                css={{
                                                    display: "flex",
                                                    gap: 4,
                                                    alignItems: "start"
                                                }}
                                            >
                                                <strong
                                                    css={{
                                                        fontSize: 12,
                                                        overflowWrap:
                                                            "anywhere",
                                                        flex: 1
                                                    }}
                                                >
                                                    {track.name}
                                                </strong>
                                                <IconButton
                                                    size="small"
                                                    aria-label={`Remove track ${index + 1}`}
                                                    onClick={() => {
                                                        setTracks((current) =>
                                                            current.filter(
                                                                (item) =>
                                                                    item.id !==
                                                                    track.id
                                                            )
                                                        );
                                                        setError("");
                                                    }}
                                                >
                                                    <CloseRounded fontSize="small" />
                                                </IconButton>
                                            </div>
                                            <p
                                                css={{
                                                    color: theme.altTextColor
                                                }}
                                            >
                                                {durationOf(
                                                    track.audio
                                                ).toFixed(2)}{" "}
                                                s
                                            </p>
                                            <div
                                                css={{
                                                    display: "flex",
                                                    gap: 4,
                                                    marginTop: 8
                                                }}
                                            >
                                                <Button
                                                    variant="outlined"
                                                    aria-label={`Mute track ${index + 1}`}
                                                    aria-pressed={track.muted}
                                                    onClick={() =>
                                                        update(track.id, {
                                                            muted: !track.muted
                                                        })
                                                    }
                                                >
                                                    Mute
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    aria-label={`Solo track ${index + 1}`}
                                                    aria-pressed={track.solo}
                                                    onClick={() =>
                                                        update(track.id, {
                                                            solo: !track.solo
                                                        })
                                                    }
                                                >
                                                    Solo
                                                </Button>
                                            </div>
                                        </div>
                                        <div
                                            css={{
                                                display: "grid",
                                                gap: 10,
                                                minWidth: 0
                                            }}
                                        >
                                            <MixTimeline
                                                track={track}
                                                span={span}
                                                audible={
                                                    !track.muted &&
                                                    (!anySolo || track.solo)
                                                }
                                                onMove={(start) =>
                                                    update(track.id, { start })
                                                }
                                            />
                                            <div
                                                className="mix-settings"
                                                css={{
                                                    display: "grid",
                                                    gridTemplateColumns:
                                                        "90px minmax(100px, 1fr) minmax(110px, 170px)",
                                                    gap: 16
                                                }}
                                            >
                                                <label>
                                                    Start (s)
                                                    <input
                                                        aria-label={`Track ${index + 1} start`}
                                                        type="number"
                                                        min={0}
                                                        step={0.01}
                                                        value={
                                                            Number.isFinite(
                                                                track.start
                                                            )
                                                                ? track.start
                                                                : ""
                                                        }
                                                        onChange={(event) =>
                                                            update(track.id, {
                                                                start: event
                                                                    .target
                                                                    .valueAsNumber
                                                            })
                                                        }
                                                    />
                                                </label>
                                                <label>
                                                    <span
                                                        css={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between"
                                                        }}
                                                    >
                                                        Gain
                                                        <output>
                                                            {track.gain} dB
                                                        </output>
                                                    </span>
                                                    <input
                                                        aria-label={`Track ${index + 1} gain`}
                                                        type="range"
                                                        min={-60}
                                                        max={12}
                                                        step={0.5}
                                                        value={track.gain}
                                                        onChange={(event) =>
                                                            update(track.id, {
                                                                gain: event
                                                                    .target
                                                                    .valueAsNumber
                                                            })
                                                        }
                                                    />
                                                </label>
                                                <label className="mix-route">
                                                    Channels
                                                    <AudioSelect
                                                        aria-label={`Track ${index + 1} channels`}
                                                        value={track.route}
                                                        onChange={(event) =>
                                                            update(track.id, {
                                                                route: event
                                                                    .target
                                                                    .value as MixTrack["route"]
                                                            })
                                                        }
                                                    >
                                                        {Object.entries(
                                                            routes
                                                        ).map(
                                                            ([
                                                                value,
                                                                label
                                                            ]) => (
                                                                <option
                                                                    key={value}
                                                                    value={
                                                                        value
                                                                    }
                                                                >
                                                                    {label}
                                                                </option>
                                                            )
                                                        )}
                                                    </AudioSelect>
                                                </label>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div
                            css={{
                                display: "flex",
                                gap: 16,
                                alignItems: "end",
                                flexWrap: "wrap"
                            }}
                        >
                            <label css={{ width: 190 }}>
                                Output gain: {gain} dB
                                <input
                                    aria-label="Output gain"
                                    type="range"
                                    min={-60}
                                    max={12}
                                    step={0.5}
                                    value={gain}
                                    onChange={(event) =>
                                        setGain(event.target.valueAsNumber)
                                    }
                                />
                            </label>
                            <p
                                css={{
                                    color: theme.altTextColor,
                                    marginLeft: "auto !important"
                                }}
                            >
                                {tracks.length}{" "}
                                {tracks.length === 1 ? "track" : "tracks"},{" "}
                                {tracks[0].audio.sampleRate} Hz, stereo
                            </p>
                        </div>
                        {displayed ? (
                            <div css={{ opacity: result ? 1 : 0.5 }}>
                                <WavePlayer
                                    audio={displayed.audio}
                                    src={url}
                                    label="Mix"
                                    playbackDisabled={!result || busy}
                                />
                            </div>
                        ) : (
                            <div
                                css={{
                                    minHeight: 196,
                                    display: "grid",
                                    alignContent: "center",
                                    gap: 8
                                }}
                            >
                                <p role="status">
                                    {preview.error
                                        ? "Fix the settings or retry to hear the mix."
                                        : loading || preview.status}
                                </p>
                                <Skeleton
                                    variant="rectangular"
                                    height={140}
                                    animation={false}
                                    css={{
                                        background: theme.headerBackground,
                                        borderRadius: 4
                                    }}
                                />
                            </div>
                        )}
                        {result && (
                            <p
                                role="status"
                                css={{
                                    color:
                                        result.peak > 1
                                            ? theme.errorText
                                            : theme.altTextColor
                                }}
                            >
                                {result.peak > 1
                                    ? `The mix peaks at +${(20 * Math.log10(result.peak)).toFixed(1)} dBFS. Lower output gain to avoid clipping during playback.`
                                    : `Peak ${result.peak ? `${(20 * Math.log10(result.peak)).toFixed(1)} dBFS` : "silent"}.`}
                            </p>
                        )}
                        <div
                            css={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                                alignItems: "center"
                            }}
                        >
                            <Button
                                variant="outlined"
                                startIcon={<DownloadRounded />}
                                disabled={!exportReady}
                                onClick={download}
                            >
                                Download
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<SaveRounded />}
                                disabled={
                                    !exportReady || saved?.file === result
                                }
                                onClick={() => {
                                    if (result && exportReady) {
                                        try {
                                            setSaved({
                                                file: result,
                                                name: onSave(result)
                                            });
                                        } catch (cause) {
                                            setError(
                                                cause instanceof Error
                                                    ? cause.message
                                                    : "Could not add the mix to the project."
                                            );
                                        }
                                    }
                                }}
                            >
                                Add to project
                            </Button>
                            {saved && saved.file === result && (
                                <p role="status">Added {saved.name}</p>
                            )}
                        </div>
                        <EditList
                            rows={rows}
                            onClear={reset}
                            status={
                                busy
                                    ? loading || preview.status
                                    : preview.error
                                      ? "The mix could not be updated."
                                      : "Preview uses the tracks and settings shown above."
                            }
                            emptyText="All tracks start at zero with their original level and channels."
                        />
                    </>
                )}
            </div>
        </section>
    );
}
