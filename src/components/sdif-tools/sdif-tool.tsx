import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@emotion/react";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import { AudioSelect } from "../audio-tools/audio-select";
import { AnalysisGraph } from "../audio-tools/visuals";
import { useDebouncedTask } from "../audio-tools/use-debounced-task";
import type { AudioSource } from "../audio-tools/audio-tool";
import type { ToolFile } from "../audio-tools/types";
import { inspectFile, updateSdif } from "./client";
import {
    checkSdifSize,
    defaults,
    exampleSdif,
    trackPlot,
    type Settings,
    type StreamInfo,
    type AdTrack
} from "./format";
export default function SdifTool({
    sources = [],
    onSave
}: {
    sources?: AudioSource[];
    onSave: (file: ToolFile) => string;
}) {
    const theme = useTheme();
    const [source, setSource] = useState<{
        file: ToolFile;
        streams: StreamInfo[];
    }>();
    const [settings, setSettings] = useState<Settings>();
    const [loading, setLoading] = useState("");
    const [error, setError] = useState("");
    const [saved, setSaved] = useState<{ data: Uint8Array; name: string }>();
    const [copied, setCopied] = useState<string>();
    const job = useRef<AbortController>(),
        input = useRef<HTMLInputElement>(null);
    useEffect(() => () => job.current?.abort(), []);
    const request = useMemo(
        () =>
            source && settings && !loading
                ? { file: source.file, settings }
                : undefined,
        [source, settings, loading]
    );
    const preview = useDebouncedTask(request, updateSdif),
        result = preview.value;
    const busy = Boolean(loading || preview.pending),
        problem = error || preview.error;
    const stream = source?.streams.find((s) => s.id === settings?.stream);
    const load = async (item: AudioSource) => {
        job.current?.abort();
        const controller = new AbortController();
        job.current = controller;
        setLoading(`Reading ${item.name}…`);
        setError("");
        try {
            const data = await item.load(controller.signal);
            controller.signal.throwIfAborted();
            const file = { name: item.name, data },
                streams = await inspectFile(
                    file,
                    controller.signal,
                    setLoading
                );
            controller.signal.throwIfAborted();
            setSource({ file, streams });
            setSettings(defaults(streams[0]));
            setSaved(undefined);
            setCopied(undefined);
        } catch (cause) {
            if (!controller.signal.aborted)
                setError(
                    cause instanceof Error
                        ? cause.message
                        : "Could not open this SDIF file."
                );
        } finally {
            if (!controller.signal.aborted) setLoading("");
        }
    };
    const change = (key: keyof Settings, value: number) => {
        if (settings) setSettings({ ...settings, [key]: value });
        setError("");
    };
    const snippet = result
        ? `aSignal adsyn 1, 1, 1, ${JSON.stringify(saved?.data === result.data ? saved.name : result.name)}\nout aSignal\n; Play for ${result.duration.toFixed(3)} seconds.\n`
        : "";
    return (
        <section
            aria-label="SDIF converter"
            aria-busy={busy}
            css={{
                height: "100%",
                overflow: "auto",
                containerType: "inline-size",
                background: theme.background,
                color: theme.textColor,
                fontFamily: theme.font.regular,
                fontSize: 12,
                "& p": { margin: 0, lineHeight: 1.5 },
                "& label": { display: "grid", gap: 6 },
                "& .MuiButton-root": {
                    color: theme.textColor,
                    borderColor: theme.line,
                    font: "inherit",
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    minHeight: 32,
                    borderRadius: 4
                },
                "& .MuiButton-root.Mui-disabled": {
                    color: theme.disabledTextColor
                },
                "& button:hover": { background: theme.buttonBackgroundHover },
                "& button:active": { transform: "scale(0.98)" },
                "& button:focus-visible, & input:focus-visible, & select:focus-visible, & summary:focus-visible":
                    {
                        outline: `2px solid ${theme.textColor}`,
                        outlineOffset: 2
                    },
                "& input[type=number], & select": {
                    boxSizing: "border-box",
                    width: "100%",
                    minWidth: 0,
                    padding: "7px 8px",
                    border: `1px solid ${theme.line}`,
                    borderRadius: 4,
                    background: theme.textFieldBackground,
                    color: theme.textColor,
                    font: "inherit"
                },
                "& .sdif-layout": {
                    display: "grid",
                    gridTemplateColumns:
                        "minmax(200px, 0.7fr) minmax(0, 1.3fr)",
                    gap: 24
                },
                "@container (max-width: 620px)": {
                    "& .sdif-layout": { gridTemplateColumns: "minmax(0, 1fr)" }
                },
                "@media (prefers-reduced-motion: reduce)": {
                    "& button": { transition: "none" },
                    "& button:active": { transform: "none" },
                    "& .MuiLinearProgress-bar": { animation: "none" }
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
                        flexWrap: "wrap",
                        alignItems: "end",
                        gap: 12
                    }}
                >
                    <div css={{ marginRight: "auto", alignSelf: "center" }}>
                        <strong css={{ fontSize: 14 }}>SDIF converter</strong>
                        <p css={{ color: theme.altTextColor }}>
                            Turn partial tracks into an adsyn instrument source.
                        </p>
                        {source && (
                            <p
                                css={{
                                    overflowWrap: "anywhere",
                                    color: theme.altTextColor
                                }}
                            >
                                {source.file.name}
                            </p>
                        )}
                    </div>
                    <label css={{ flex: "1 1 180px", maxWidth: 300 }}>
                        Project analysis
                        <AudioSelect
                            aria-label="Project SDIF file"
                            value=""
                            disabled={Boolean(loading)}
                            onChange={(event) => {
                                const item = sources.find(
                                    (s) => s.id === event.target.value
                                );
                                if (item) void load(item);
                            }}
                        >
                            <option value="">Open a project file…</option>
                            {sources.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </AudioSelect>
                    </label>
                    <Button
                        variant="outlined"
                        startIcon={<UploadFileRounded />}
                        disabled={Boolean(loading)}
                        onClick={() => input.current?.click()}
                    >
                        Open file
                    </Button>
                    <input
                        ref={input}
                        type="file"
                        aria-label="Open SDIF file"
                        accept=".sdif"
                        hidden
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file)
                                void load({
                                    id: file.name,
                                    name: file.name,
                                    load: async (signal) => {
                                        checkSdifSize(file.size);
                                        const data = new Uint8Array(
                                            await file.arrayBuffer()
                                        );
                                        signal.throwIfAborted();
                                        return data;
                                    }
                                });
                        }}
                    />
                </header>
                {loading && (
                    <div
                        css={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                        <p role="status" css={{ flex: 1 }}>
                            {loading}
                        </p>
                        <Button
                            onClick={() => {
                                job.current?.abort();
                                setLoading("");
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                )}
                {problem && (
                    <div
                        role="alert"
                        css={{
                            padding: 12,
                            borderLeft: `3px solid ${theme.errorText}`,
                            overflowWrap: "anywhere"
                        }}
                    >
                        <p>{problem}</p>
                        {preview.error && (
                            <Button onClick={preview.retry}>Retry</Button>
                        )}
                    </div>
                )}
                <div css={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadRounded />}
                        disabled={!result || busy}
                        onClick={() => {
                            if (!result) return;
                            const url = URL.createObjectURL(
                                new Blob([result.data])
                            );
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = result.name;
                            a.click();
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                        }}
                    >
                        Download .het
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<SaveRounded />}
                        disabled={
                            !result || busy || saved?.data === result.data
                        }
                        onClick={() => {
                            if (result)
                                try {
                                    setSaved({
                                        data: result.data,
                                        name: onSave(result)
                                    });
                                } catch (cause) {
                                    setError(
                                        cause instanceof Error
                                            ? cause.message
                                            : "Could not add the result."
                                    );
                                }
                        }}
                    >
                        Add to project
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ContentCopyRounded />}
                        disabled={!result || busy}
                        onClick={async () => {
                            if (!result) return;
                            try {
                                await navigator.clipboard.writeText(snippet);
                                setCopied(snippet);
                                setError("");
                            } catch {
                                setError(
                                    "Could not copy. Select the code below and copy it with your keyboard."
                                );
                            }
                        }}
                    >
                        {result && copied === snippet
                            ? "Copied"
                            : "Copy Csound code"}
                    </Button>
                </div>
                {saved && saved.data === result?.data && (
                    <p role="status">Added {saved.name}</p>
                )}
                {!source ? (
                    <div
                        css={{
                            padding: "28px 0",
                            display: "grid",
                            gap: 12,
                            justifyItems: "start"
                        }}
                    >
                        <p>
                            Open an SDIF analysis containing 1TRC tracks, or
                            start with three example partials.
                        </p>
                        <Button
                            variant="outlined"
                            disabled={Boolean(loading)}
                            onClick={() =>
                                void load({
                                    id: "example",
                                    name: "example.sdif",
                                    load: async () => exampleSdif()
                                })
                            }
                        >
                            Try example
                        </Button>
                    </div>
                ) : (
                    <div className="sdif-layout">
                        <div
                            css={{
                                display: "grid",
                                alignContent: "start",
                                gap: 16,
                                minWidth: 0
                            }}
                        >
                            <div
                                css={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8
                                }}
                            >
                                <strong css={{ flex: 1 }}>
                                    Export settings
                                </strong>
                                <Button
                                    disabled={!stream || Boolean(loading)}
                                    onClick={() => {
                                        if (stream)
                                            setSettings(defaults(stream));
                                        setError("");
                                    }}
                                >
                                    Reset settings
                                </Button>
                            </div>
                            <label>
                                Stream
                                <AudioSelect
                                    aria-label="Stream"
                                    value={settings?.stream}
                                    disabled={Boolean(loading)}
                                    onChange={(event) => {
                                        const item = source.streams.find(
                                            (s) =>
                                                s.id ===
                                                Number(event.target.value)
                                        );
                                        if (item) setSettings(defaults(item));
                                    }}
                                >
                                    {source.streams.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            Stream {s.id} · {s.partials} tracks
                                        </option>
                                    ))}
                                </AudioSelect>
                            </label>
                            <div
                                css={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 12
                                }}
                            >
                                {(
                                    [
                                        ["start", "Start (s)"],
                                        ["end", "End (s)"]
                                    ] as const
                                ).map(([key, label]) => (
                                    <label key={key}>
                                        {label}
                                        <input
                                            aria-label={label}
                                            type="number"
                                            min={stream?.start}
                                            max={stream?.end}
                                            step="0.001"
                                            value={
                                                Number.isFinite(settings?.[key])
                                                    ? settings![key]
                                                    : ""
                                            }
                                            disabled={Boolean(loading)}
                                            onChange={(event) =>
                                                change(
                                                    key,
                                                    event.target.valueAsNumber
                                                )
                                            }
                                        />
                                    </label>
                                ))}
                            </div>
                            <label>
                                Keep first partials
                                <input
                                    aria-label="Partial limit"
                                    type="number"
                                    min={1}
                                    max={Math.min(
                                        1024,
                                        stream?.partials ?? 1024
                                    )}
                                    step={1}
                                    value={
                                        Number.isFinite(settings?.partials)
                                            ? settings!.partials
                                            : ""
                                    }
                                    disabled={Boolean(loading)}
                                    onChange={(event) =>
                                        change(
                                            "partials",
                                            event.target.valueAsNumber
                                        )
                                    }
                                />
                            </label>
                            <p css={{ color: theme.altTextColor }}>
                                Tracks follow source ID order.{" "}
                                {stream?.partials} available.
                            </p>
                            <label>
                                Gain (dB)
                                <input
                                    aria-label="Gain (dB)"
                                    type="number"
                                    min={-60}
                                    max={24}
                                    step={0.5}
                                    value={
                                        Number.isFinite(settings?.gain)
                                            ? settings!.gain
                                            : ""
                                    }
                                    disabled={Boolean(loading)}
                                    onChange={(event) =>
                                        change(
                                            "gain",
                                            event.target.valueAsNumber
                                        )
                                    }
                                />
                            </label>
                            <p css={{ color: theme.altTextColor }}>
                                Source range: {stream?.start.toFixed(3)} to{" "}
                                {stream?.end.toFixed(3)} s. Export up to 32.76
                                s, starting at zero in the output.
                            </p>
                            <details>
                                <summary
                                    css={{
                                        cursor: "pointer",
                                        padding: "6px 0"
                                    }}
                                >
                                    About this conversion
                                </summary>
                                <div
                                    css={{
                                        display: "grid",
                                        gap: 8,
                                        paddingTop: 8,
                                        color: theme.altTextColor
                                    }}
                                >
                                    <p>
                                        Only the selected 1TRC stream becomes
                                        sound. Other SDIF data and phase values
                                        are omitted.
                                    </p>
                                    <p>
                                        Missing tracks become silent at those
                                        frames. The range boundaries interpolate
                                        between frames. Times become whole
                                        milliseconds; amplitude and frequency
                                        become 16-bit whole numbers.
                                    </p>
                                    <p>
                                        Gain must keep each partial at or below
                                        full amplitude. Frequencies above 32767
                                        Hz cannot be exported. Up to 1024
                                        partials, 500,000 points, and 32 MB per
                                        source file.
                                    </p>
                                </div>
                            </details>
                            {result && (
                                <div>
                                    <strong>Use in Csound</strong>
                                    <pre
                                        css={{
                                            whiteSpace: "pre-wrap",
                                            overflowWrap: "anywhere",
                                            fontFamily: theme.font.monospace,
                                            background: theme.headerBackground,
                                            padding: 12,
                                            borderRadius: 4
                                        }}
                                    >
                                        {snippet}
                                    </pre>
                                </div>
                            )}
                        </div>
                        <div
                            css={{
                                display: "grid",
                                alignContent: "start",
                                gap: 12,
                                minWidth: 0
                            }}
                        >
                            {result ? (
                                <TrackPreview
                                    tracks={result.tracks}
                                    duration={result.duration}
                                    omitted={result.omitted}
                                />
                            ) : (
                                <div
                                    css={{
                                        minHeight: 240,
                                        border: `1px dashed ${theme.line}`,
                                        borderRadius: 4,
                                        padding: 20,
                                        display: "grid",
                                        alignContent: "center"
                                    }}
                                >
                                    <p role="status">
                                        {busy
                                            ? loading || preview.status
                                            : "Fix the export settings to view the converted tracks."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
function TrackPreview({
    tracks,
    duration,
    omitted
}: {
    tracks: AdTrack[];
    duration: number;
    omitted: number;
}) {
    const theme = useTheme(),
        [index, setIndex] = useState(0),
        selected = Math.min(index, tracks.length - 1);
    const plots = useMemo(
        () => [
            trackPlot(tracks[selected], false, duration),
            trackPlot(tracks[selected], true, duration)
        ],
        [tracks, selected, duration]
    );
    return (
        <>
            <label>
                Preview partial
                <AudioSelect
                    aria-label="Preview partial"
                    value={selected}
                    onChange={(event) => setIndex(Number(event.target.value))}
                >
                    {tracks.map((t, i) => (
                        <option key={t.id} value={i}>
                            Partial {i + 1} (source ID {t.id})
                        </option>
                    ))}
                </AudioSelect>
            </label>
            <p css={{ color: theme.altTextColor }}>
                {tracks.length} partials, {duration.toFixed(3)} s.{" "}
                {omitted
                    ? `${omitted} tracks excluded by the partial limit.`
                    : "All tracks included."}
            </p>
            {plots.map((plot) => (
                <AnalysisGraph key={plot.label} plot={plot} />
            ))}
            <p role="status" css={{ color: theme.altTextColor }}>
                Preview shows the exported adsyn data.
            </p>
        </>
    );
}
