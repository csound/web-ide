import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@emotion/react";
import Button from "@mui/material/Button";
import Slider from "@mui/material/Slider";
import Skeleton from "@mui/material/Skeleton";
import LinearProgress from "@mui/material/LinearProgress";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import GraphicEqRounded from "@mui/icons-material/GraphicEqRounded";
import { decodeAudio, durationOf, encodeAudioAsync } from "./audio";
import {
    analysisOperations,
    defaultSettings,
    sampleOperations,
    type AnalysisOperation,
    type Operation,
    type Settings,
    type SampleOperation
} from "./operations";
import { checkAudioBytes, readAudioStream } from "./limits";
import { AnalysisGraph } from "./visuals";
import { WavePlayer } from "./wave-player";
import { AudioSelect } from "./audio-select";
import { EditList } from "./edit-list";
import { stageEdit, describeEdit, type SampleEdit } from "./sample-edits";
import {
    buildPreview,
    buildBins,
    type LoadedAudio,
    type PreviewRequest
} from "./preview";
import { useDebouncedTask } from "./use-debounced-task";
import type { ToolFile } from "./types";

export type AudioSource = {
    id: string;
    name: string;
    load: (signal: AbortSignal) => Promise<Uint8Array>;
};

/** Own one playback URL and revoke it when the preview changes. */
function useAudioUrl(data?: Uint8Array) {
    const [owned, setOwned] = useState<{ data: Uint8Array; url: string }>();
    useEffect(() => {
        if (!data) {
            setOwned(undefined);
            return;
        }
        const next = URL.createObjectURL(
            new Blob([data], { type: "audio/wav" })
        );
        setOwned({ data, url: next });
        return () => URL.revokeObjectURL(next);
    }, [data]);
    return owned?.data === data ? owned?.url : undefined;
}

/** A single automatic preview for sample edits and audio analysis. */
export default function AudioTool({
    mode,
    sources = [],
    onSave
}: {
    mode: "sample" | "analysis";
    sources?: AudioSource[];
    onSave: (file: ToolFile) => string;
}) {
    const theme = useTheme();
    const analysis = mode === "analysis";
    const choices = analysis ? analysisOperations : sampleOperations;
    const [operation, setOperation] = useState<Operation>(
        analysis ? "spectrum" : "trim"
    );
    const [source, setSource] = useState<LoadedAudio>();
    const [settings, setSettings] = useState(defaultSettings);
    const [range, setRange] = useState<[number, number]>([0, 1]);
    const [channel, setChannel] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState<{ file: ToolFile; name: string }>();
    const [frameTime, setFrameTime] = useState(0);
    const [inspecting, setInspecting] = useState(false);
    const [analysisEnabled, setAnalysisEnabled] = useState(false);
    const [edits, setEdits] = useState<SampleEdit[]>([]);
    const job = useRef<AbortController>();
    const input = useRef<HTMLInputElement>(null);
    const duration = source ? durationOf(source.audio) : 1;
    const selectRange =
        !analysis && (operation === "trim" || operation === "denoise");
    const analysisConfig = useMemo(
        () =>
            analysis && analysisEnabled
                ? {
                      operation: operation as AnalysisOperation,
                      settings,
                      channel
                  }
                : undefined,
        [analysis, analysisEnabled, operation, settings, channel]
    );
    const request = useMemo<PreviewRequest | undefined>(
        () =>
            source && !loading && (analysis ? analysisConfig : edits.length)
                ? { source, edits, analysis: analysisConfig }
                : undefined,
        [source, loading, analysis, analysisConfig, edits]
    );
    const preview = useDebouncedTask(request, buildPreview);
    const result = preview.value;
    const binRequest = useMemo(
        () =>
            result?.spectrum && inspecting
                ? { preview: result, time: frameTime }
                : undefined,
        [result, inspecting, frameTime]
    );
    const inspection = useDebouncedTask(binRequest, buildBins);
    const updating = preview.pending || inspection.pending;
    // Loaded formats are decoded to WAV; exports must use the matching extension.
    const loadedFile = useMemo(
        () =>
            source
                ? {
                      name: `${source.name.replace(/\.[^.]+$/, "")}.wav`,
                      data: source.data
                  }
                : undefined,
        [source]
    );
    const file = result || loadedFile;
    const audio = result?.audio || source?.audio;
    const audioUrl = useAudioUrl(result?.audio ? result.data : source?.data);
    const problem = error || preview.error || inspection.error;
    const exportReady = Boolean(
        file && !loading && !preview.pending && !preview.error
    );
    const trim = result?.audio
        ? edits.find((edit) => edit.operation === "trim")
        : undefined;
    const offset = trim?.range[0] || 0;
    const visibleDuration = audio ? durationOf(audio) : duration;
    const visibleRange: [number, number] = [
        Math.max(0, range[0] - offset),
        Math.min(visibleDuration, range[1] - offset)
    ];
    useEffect(() => () => job.current?.abort(), []);

    const cancel = () => {
        job.current?.abort();
        setLoading(false);
    };
    const clear = () => {
        setEdits([]);
        setAnalysisEnabled(false);
        setSettings(defaultSettings);
        setRange([0, duration]);
        setChannel(0);
        setOperation(analysis ? "spectrum" : "trim");
        setInspecting(false);
        setFrameTime(0);
        setError("");
        setSaved(undefined);
    };
    const changeSetting = (key: keyof Settings, value: number) => {
        const next = { ...settings, [key]: value };
        setSettings(next);
        setError("");
        if (analysis) setAnalysisEnabled(true);
        else
            setEdits((current) =>
                stageEdit(current, {
                    operation: operation as SampleOperation,
                    settings: next,
                    range
                })
            );
    };
    const changeRange = (next: [number, number]) => {
        setRange(next);
        setEdits((current) =>
            stageEdit(current, {
                operation: operation as SampleOperation,
                settings,
                range: next
            })
        );
    };
    const chooseOperation = (next: Operation) => {
        setOperation(next);
        setError("");
        if (analysis) {
            setAnalysisEnabled(true);
            setInspecting(false);
            return;
        }
        const existing = edits.find((edit) => edit.operation === next);
        if (existing) {
            setSettings(existing.settings);
            setRange(existing.range);
            return;
        }
        const nextRange: [number, number] =
            next === "denoise" ? [0, Math.min(0.2, duration)] : [0, duration];
        setRange(nextRange);
        setSettings(defaultSettings);
        setEdits((current) =>
            stageEdit(current, {
                operation: next as SampleOperation,
                settings: defaultSettings,
                range: nextRange
            })
        );
    };
    const removeEdit = (edit: SampleEdit) => {
        setEdits((current) =>
            current.filter((item) => item.operation !== edit.operation)
        );
        if (edit.operation === operation) {
            setSettings(defaultSettings);
            setRange(
                edit.operation === "denoise"
                    ? [0, Math.min(0.2, duration)]
                    : [0, duration]
            );
        }
    };
    const resetAnalysis = () => {
        clear();
        setOperation(operation);
    };
    const rows = analysis
        ? analysisEnabled
            ? [
                  {
                      id: operation,
                      label: analysisOperations.find(
                          (item) => item.id === operation
                      )!.label,
                      detail: [
                          source && source.audio.channels.length > 1
                              ? `Channel ${channel + 1}`
                              : "Mono",
                          {
                              spectrum: `Frequency detail ${settings.fft}`,
                              partials: "Track individual tones",
                              harmonics: `${settings.fundamental} Hz · ${settings.harmonics} harmonics`,
                              lpc: `${settings.poles} filter poles`,
                              envelope: `${settings.window} s window`
                          }[operation as AnalysisOperation]
                      ].join(" · "),
                      remove: resetAnalysis
                  }
              ]
            : []
        : edits.map((edit) => ({
              id: edit.operation,
              ...describeEdit(edit),
              remove: () => removeEdit(edit)
          }));

    /** Replace the source without allowing an older load or preview to finish later. */
    const load = async (
        name: string,
        read: (signal: AbortSignal) => Promise<Uint8Array>
    ) => {
        job.current?.abort();
        const controller = new AbortController();
        job.current = controller;
        setLoading(true);
        setSource(undefined);
        clear();
        try {
            const bytes = await read(controller.signal);
            controller.signal.throwIfAborted();
            checkAudioBytes(bytes.length);
            const decoded = await decodeAudio(bytes, controller.signal);
            const data = await encodeAudioAsync(decoded, controller.signal);
            controller.signal.throwIfAborted();
            setSource({ name, audio: decoded, data });
            setRange([0, durationOf(decoded)]);
            setAnalysisEnabled(analysis);
        } catch (failure) {
            if (!controller.signal.aborted)
                setError(
                    failure instanceof Error
                        ? failure.message
                        : "Could not open this audio file."
                );
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    };
    const download = () => {
        if (!file || !exportReady) return;
        const url = URL.createObjectURL(new Blob([file.data]));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = file.name;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    /** Render a labelled numeric setting with operation-specific bounds. */
    const number = (
        label: string,
        key: keyof Settings,
        min: number,
        max: number,
        step = 1
    ) => (
        <label>
            {label}
            <input
                type="number"
                value={Number.isFinite(settings[key]) ? settings[key] : ""}
                min={min}
                max={max}
                step={step}
                disabled={loading}
                onChange={(event) =>
                    changeSetting(key, event.currentTarget.valueAsNumber)
                }
            />
        </label>
    );
    /** Render a slider that commits changes after dragging to keep interaction smooth. */
    const slider = (
        label: string,
        key: keyof Settings,
        min: number,
        max: number,
        unit: string
    ) => (
        <label css={{ minWidth: 180, flex: "1 1 180px", maxWidth: 320 }}>
            <span
                css={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12
                }}
            >
                {label}
                <output>
                    {settings[key]} {unit}
                </output>
            </span>
            <Slider
                key={`${operation}-${key}`}
                aria-label={label}
                value={settings[key]}
                min={min}
                max={max}
                step={1}
                disabled={loading}
                onChange={(_, value) => changeSetting(key, value as number)}
                valueLabelDisplay="auto"
                css={{
                    color: theme.tabHighlightActive,
                    width: "calc(100% - 16px)",
                    margin: "0 8px"
                }}
            />
        </label>
    );
    return (
        <section
            onPlayCapture={(event) => {
                for (const audio of Array.from(
                    event.currentTarget.querySelectorAll("audio")
                )) {
                    if (audio !== event.target) audio.pause();
                }
            }}
            aria-busy={loading || updating}
            aria-label={analysis ? "Audio Analysis" : "Sample Editor"}
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
                "& button:focus-visible, & input:focus-visible, & select:focus-visible, & summary:focus-visible":
                    {
                        outline: `2px solid ${theme.textColor}`,
                        outlineOffset: 2
                    },
                "& button:active": { transform: "scale(0.98)" },
                "& .MuiButton-root": {
                    color: theme.textColor,
                    borderColor: theme.line,
                    minHeight: 32
                },
                "& .MuiButton-root:hover": {
                    background: theme.buttonBackgroundHover
                },
                "& .MuiButton-root.Mui-disabled": {
                    color: theme.disabledTextColor
                },
                "& label": {
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
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
                "& input[type=number]": {
                    maxWidth: 130,
                    fontFamily: theme.font.monospace
                },
                "& output": { fontFamily: theme.font.monospace },
                "& p": { fontSize: 12, lineHeight: 1.5, margin: 0 },
                "& fieldset": { border: 0, padding: 0, margin: 0, minWidth: 0 },
                "@media (prefers-reduced-motion: reduce)": {
                    "& .MuiLinearProgress-bar": { animation: "none" }
                }
            }}
        >
            {(loading || updating) && (
                <div
                    css={{
                        position: "sticky",
                        top: 0,
                        height: 0,
                        zIndex: 2,
                        background: theme.background
                    }}
                >
                    <LinearProgress
                        aria-label={
                            loading
                                ? "Reading audio"
                                : preview.pending
                                  ? preview.status
                                  : inspection.status
                        }
                        css={{
                            background: theme.line,
                            "& .MuiLinearProgress-bar": {
                                background: theme.tabHighlightActive
                            }
                        }}
                    />
                </div>
            )}
            <div
                css={{
                    padding: "12px 16px",
                    borderBottom: `1px solid ${theme.line}`,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                    gap: 12
                }}
            >
                <label css={{ flex: "1 1 180px" }}>
                    Audio file
                    <AudioSelect
                        aria-label="Project audio file"
                        value=""
                        disabled={!sources.length}
                        onChange={(event) => {
                            const chosen = sources.find(
                                (item) => item.id === event.target.value
                            );
                            if (chosen) void load(chosen.name, chosen.load);
                        }}
                    >
                        <option value="">
                            {source?.name ||
                                (sources.length
                                    ? "Choose project audio"
                                    : "Open an audio file to start")}
                        </option>
                        {sources.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </AudioSelect>
                </label>
                <Button
                    variant="outlined"
                    startIcon={<UploadFileRounded />}
                    disabled={loading}
                    onClick={() => input.current?.click()}
                >
                    Open audio
                </Button>
                <input
                    ref={input}
                    type="file"
                    accept="audio/*,.wav,.aif,.aiff,.flac,.ogg,.mp3"
                    aria-label="Open audio file"
                    hidden
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file)
                            void load(file.name, async (signal) => {
                                checkAudioBytes(file.size);
                                return readAudioStream(
                                    file.stream(),
                                    signal,
                                    file.size
                                );
                            });
                    }}
                />
            </div>
            {!source && !loading && (
                <div
                    css={{
                        minHeight: 220,
                        display: "grid",
                        placeContent: "center",
                        gap: 12,
                        padding: 24,
                        textAlign: "center",
                        color: theme.altTextColor
                    }}
                >
                    <GraphicEqRounded
                        css={{
                            margin: "auto",
                            fontSize: 40,
                            color: theme.tabHighlightActive
                        }}
                    />
                    <strong css={{ fontSize: 15, color: theme.textColor }}>
                        {analysis
                            ? "See what is in your sound"
                            : "Shape a sample"}
                    </strong>
                    <p>
                        {analysis
                            ? "Open audio to explore its spectrum, tones, voice, or envelope."
                            : "Open audio to trim, adjust levels, change its rate, or reduce noise."}
                    </p>
                    <p>
                        Files stay in your browser until you choose to save
                        them.
                    </p>
                </div>
            )}
            {loading && (
                <div
                    role="status"
                    aria-label="Loading audio"
                    css={{ padding: 16 }}
                >
                    <Skeleton
                        animation={false}
                        variant="rectangular"
                        height={156}
                        css={{ background: theme.highlightBackground }}
                    />
                    <p css={{ marginTop: "12px !important" }}>Reading audio…</p>
                    <Button onClick={cancel}>Cancel</Button>
                </div>
            )}
            {source && audio && !loading && (
                <div
                    css={{ padding: 16, display: "grid", gap: 16, minWidth: 0 }}
                >
                    <div
                        css={{
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            gap: 8,
                            alignItems: "center"
                        }}
                    >
                        <strong
                            role="status"
                            css={{ fontSize: 12, overflowWrap: "anywhere" }}
                        >
                            {file?.name}
                        </strong>
                        <span css={{ fontSize: 11, color: theme.altTextColor }}>
                            {visibleDuration.toFixed(2)} s /{" "}
                            {audio.sampleRate.toLocaleString()} Hz /{" "}
                            {audio.channels.length === 1
                                ? "Mono"
                                : `${audio.channels.length} channels`}
                        </span>
                    </div>
                    <WavePlayer
                        audio={audio}
                        src={audioUrl}
                        label="Preview"
                        playbackDisabled={
                            preview.pending || Boolean(preview.error)
                        }
                        range={
                            selectRange && visibleRange[1] > visibleRange[0]
                                ? visibleRange
                                : undefined
                        }
                        onSelect={
                            selectRange
                                ? (next) =>
                                      changeRange([
                                          next[0] + offset,
                                          next[1] + offset
                                      ])
                                : undefined
                        }
                    />
                    {result?.plot && <AnalysisGraph plot={result.plot} />}
                    {result?.spectrum && (
                        <details
                            open={inspecting}
                            onToggle={(event) =>
                                setInspecting(event.currentTarget.open)
                            }
                        >
                            <summary css={{ fontSize: 12, cursor: "pointer" }}>
                                Inspect frequency bins
                            </summary>
                            {inspecting && (
                                <div
                                    css={{
                                        display: "grid",
                                        gap: 12,
                                        marginTop: 12
                                    }}
                                >
                                    <label>
                                        Time (seconds)
                                        <input
                                            type="number"
                                            min={0}
                                            max={duration}
                                            step="0.01"
                                            value={frameTime}
                                            onChange={(event) => {
                                                const value =
                                                    event.target.valueAsNumber;
                                                if (
                                                    Number.isFinite(value) &&
                                                    value >= 0 &&
                                                    value <= duration
                                                )
                                                    setFrameTime(value);
                                            }}
                                        />
                                    </label>
                                    {inspection.pending && (
                                        <p role="status">{inspection.status}</p>
                                    )}
                                    {inspection.value && (
                                        <AnalysisGraph
                                            plot={inspection.value}
                                        />
                                    )}
                                </div>
                            )}
                        </details>
                    )}
                    <div
                        role="group"
                        aria-label={
                            analysis ? "Analysis type" : "Sample operation"
                        }
                        css={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 4,
                            paddingBottom: 12,
                            borderBottom: `1px solid ${theme.line}`
                        }}
                    >
                        {choices.map((choice) => (
                            <Button
                                key={choice.id}
                                disabled={loading}
                                aria-pressed={operation === choice.id}
                                onClick={() => chooseOperation(choice.id)}
                                css={
                                    operation === choice.id
                                        ? {
                                              "&&": {
                                                  background:
                                                      theme.highlightBackgroundAlt,
                                                  boxShadow: `inset 0 -2px ${theme.tabHighlightActive}`
                                              }
                                          }
                                        : undefined
                                }
                            >
                                {choice.label}
                            </Button>
                        ))}
                    </div>
                    <p css={{ color: theme.altTextColor }}>
                        {
                            choices.find((choice) => choice.id === operation)
                                ?.hint
                        }
                    </p>
                    <fieldset
                        disabled={loading}
                        css={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 16,
                            alignItems: "flex-start",
                            "@container (max-width: 420px)": { gap: 12 }
                        }}
                    >
                        {selectRange && (
                            <>
                                <label>
                                    Start (seconds)
                                    <input
                                        aria-label="Selection start"
                                        type="number"
                                        value={Number(range[0].toFixed(4))}
                                        min={0}
                                        max={
                                            range[1] -
                                            1 / source.audio.sampleRate
                                        }
                                        step="0.01"
                                        onChange={(event) => {
                                            const value =
                                                event.target.valueAsNumber;
                                            if (
                                                Number.isFinite(value) &&
                                                value >= 0 &&
                                                value < range[1]
                                            ) {
                                                changeRange([value, range[1]]);
                                            }
                                        }}
                                    />
                                </label>
                                <label>
                                    End (seconds)
                                    <input
                                        aria-label="Selection end"
                                        type="number"
                                        value={Number(range[1].toFixed(4))}
                                        min={
                                            range[0] +
                                            1 / source.audio.sampleRate
                                        }
                                        max={duration}
                                        step="0.01"
                                        onChange={(event) => {
                                            const value =
                                                event.target.valueAsNumber;
                                            if (
                                                Number.isFinite(value) &&
                                                value > range[0] &&
                                                value <= duration
                                            ) {
                                                changeRange([range[0], value]);
                                            }
                                        }}
                                    />
                                </label>
                                <div css={{ alignSelf: "flex-end" }}>
                                    <Button
                                        disabled={loading}
                                        onClick={() => {
                                            changeRange([0, duration]);
                                        }}
                                    >
                                        Select all
                                    </Button>
                                </div>
                            </>
                        )}
                        {operation === "gain" &&
                            slider("Gain", "gain", -36, 18, "dB")}
                        {operation === "normalize" &&
                            slider("Peak level", "peak", -24, 0, "dB")}
                        {operation === "denoise" &&
                            slider("Noise reduction", "reduction", 6, 60, "dB")}
                        {operation === "resample" && (
                            <label>
                                Sample rate
                                <AudioSelect
                                    value={settings.rate}
                                    onChange={(event) =>
                                        changeSetting(
                                            "rate",
                                            Number(event.target.value)
                                        )
                                    }
                                >
                                    {[
                                        8000, 16000, 22050, 32000, 44100, 48000,
                                        88200, 96000
                                    ].map((rate) => (
                                        <option key={rate} value={rate}>
                                            {rate.toLocaleString()} Hz
                                        </option>
                                    ))}
                                </AudioSelect>
                            </label>
                        )}
                        {analysis && source.audio.channels.length > 1 && (
                            <label>
                                Channel
                                <AudioSelect
                                    value={channel}
                                    onChange={(event) => {
                                        setChannel(Number(event.target.value));
                                        setAnalysisEnabled(true);
                                    }}
                                >
                                    {source.audio.channels.map((_, index) => (
                                        <option key={index} value={index}>
                                            Channel {index + 1}
                                        </option>
                                    ))}
                                </AudioSelect>
                            </label>
                        )}
                        {operation === "spectrum" && (
                            <label>
                                Frequency detail
                                <AudioSelect
                                    value={settings.fft}
                                    onChange={(event) =>
                                        changeSetting(
                                            "fft",
                                            Number(event.target.value)
                                        )
                                    }
                                >
                                    <option value={512}>
                                        Fast transients (512)
                                    </option>
                                    <option value={2048}>
                                        Balanced (2048)
                                    </option>
                                    <option value={8192}>
                                        Fine pitches (8192)
                                    </option>
                                </AudioSelect>
                            </label>
                        )}
                        {operation === "harmonics" && (
                            <>
                                {number(
                                    "Fundamental (Hz)",
                                    "fundamental",
                                    20,
                                    4000
                                )}
                                {number("Harmonics", "harmonics", 1, 32)}
                            </>
                        )}
                        {operation === "lpc" &&
                            number("Filter poles", "poles", 4, 60, 2)}
                        {operation === "envelope" &&
                            number(
                                "Window (seconds)",
                                "window",
                                0.005,
                                1,
                                0.005
                            )}
                    </fieldset>
                    {selectRange && (
                        <p css={{ color: theme.altTextColor }}>
                            Range times refer to the loaded file.
                        </p>
                    )}
                    <EditList
                        rows={rows}
                        status={
                            preview.pending
                                ? preview.status
                                : preview.error
                                  ? "Preview unavailable. Check the settings or retry."
                                  : undefined
                        }
                        onClear={clear}
                    />
                    <div css={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <Button
                            variant="outlined"
                            startIcon={<SaveRounded />}
                            disabled={!exportReady || saved?.file === file}
                            onClick={() => {
                                if (!file || !exportReady) return;
                                try {
                                    setSaved({ file, name: onSave(file) });
                                } catch {
                                    setError(
                                        "Could not save the file. Download it or try again."
                                    );
                                }
                            }}
                        >
                            Add to project
                        </Button>
                        <Button
                            startIcon={<DownloadRounded />}
                            disabled={!exportReady}
                            onClick={download}
                        >
                            Download
                        </Button>
                    </div>
                    {saved?.file === file && (
                        <p role="status">
                            Added {saved?.name} to the file tree. Project owners
                            can use its upload button to save it.
                        </p>
                    )}
                </div>
            )}
            {problem && (
                <div
                    role="alert"
                    css={{
                        margin: 16,
                        padding: 12,
                        border: `1px solid ${theme.errorText}`,
                        borderRadius: 4,
                        color: theme.errorText,
                        fontSize: 12,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere"
                    }}
                >
                    {problem}
                    {(preview.error || inspection.error) && (
                        <Button
                            onClick={
                                preview.error ? preview.retry : inspection.retry
                            }
                        >
                            Retry
                        </Button>
                    )}
                </div>
            )}
        </section>
    );
}
