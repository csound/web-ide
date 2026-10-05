import { useEffect, useRef, useState } from "react";
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
    makeRequest,
    resultFilename,
    sampleOperations,
    type AnalysisOperation,
    type Operation,
    type Settings
} from "./operations";
import { analysisPlot, binPlot, inspectFrame } from "./plots";
import { runTool } from "./runner";
import { checkAudioBytes, readAudioStream } from "./limits";
import { AnalysisGraph, Waveform } from "./visuals";
import type { AudioData, Plot, ToolFile } from "./types";

export type AudioSource = {
    id: string;
    name: string;
    load: (signal: AbortSignal) => Promise<Uint8Array>;
};
type LoadedAudio = { name: string; audio: AudioData; data: Uint8Array };
type Result = ToolFile & {
    audio?: AudioData;
    plot?: Plot;
    operation: Operation;
    sampleRate: number;
    log: string;
};

/** Own a preview URL and revoke it when audio changes or the window closes. */
function useAudioUrl(data?: Uint8Array) {
    const [url, setUrl] = useState<string>();
    useEffect(() => {
        if (!data) {
            setUrl(undefined);
            return;
        }
        const next = URL.createObjectURL(
            new Blob([data], { type: "audio/wav" })
        );
        setUrl(next);
        return () => URL.revokeObjectURL(next);
    }, [data]);
    return url;
}

/** Provide visual editing or analysis with cancellable loading, previews, and explicit result retention. */
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
    const [result, setResult] = useState<Result>();
    const [settings, setSettings] = useState(defaultSettings);
    const [range, setRange] = useState<[number, number]>([0, 1]);
    const [channel, setChannel] = useState(0);
    const [busy, setBusy] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState("");
    const [frameTime, setFrameTime] = useState(0);
    const [bins, setBins] = useState<Plot>();
    const [preview, setPreview] = useState<"original" | "result">("result");
    const job = useRef<AbortController>();
    const input = useRef<HTMLInputElement>(null);
    const sourceUrl = useAudioUrl(source?.data);
    const resultUrl = useAudioUrl(result?.audio ? result.data : undefined);
    const duration = source ? durationOf(source.audio) : 1;
    const active = Boolean(busy) || loading;
    const selectRange =
        !analysis && (operation === "trim" || operation === "denoise");
    useEffect(
        () => () => {
            job.current?.abort();
        },
        []
    );

    /** Abort the active load or worker and restore the controls. */
    const cancel = () => {
        job.current?.abort();
        setBusy("");
        setLoading(false);
    };
    /** Clear output and feedback when the source or settings change. */
    const resetResult = () => {
        setResult(undefined);
        setSaved("");
        setBins(undefined);
        setError("");
    };
    /** Update one setting and discard results produced with the old value. */
    const changeSetting = (key: keyof Settings, value: number) => {
        setSettings((current) => ({ ...current, [key]: value }));
        resetResult();
    };
    /** Read and decode one source within tool limits, ignoring cancelled or superseded loads. */
    const load = async (
        name: string,
        read: (signal: AbortSignal) => Promise<Uint8Array>
    ) => {
        job.current?.abort();
        const controller = new AbortController();
        job.current = controller;
        setLoading(true);
        setBusy("");
        resetResult();
        try {
            const bytes = await read(controller.signal);
            controller.signal.throwIfAborted();
            checkAudioBytes(bytes.length);
            const audio = await decodeAudio(bytes, controller.signal);
            if (controller.signal.aborted) return;
            const data = await encodeAudioAsync(audio, controller.signal);
            if (controller.signal.aborted) return;
            setSource({ name, audio, data });
            setRange([0, durationOf(audio)]);
            setChannel(0);
            setFrameTime(0);
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
    /** Apply a local trim or run the selected WASM command, then prepare its visual result. */
    const run = async () => {
        if (!source || active) return;
        const controller = new AbortController();
        job.current = controller;
        resetResult();
        setBusy("Preparing audio…");
        try {
            const data =
                analysis && source.audio.channels.length > 1
                    ? await encodeAudioAsync(
                          source.audio,
                          controller.signal,
                          [0, duration],
                          channel
                      )
                    : source.data;
            // extractor in wasm-bin beta27 skips a buffered block and mishandles
            // channels. Copy the selected frames directly to keep trims exact.
            const output =
                operation === "trim"
                    ? {
                          data: await encodeAudioAsync(
                              source.audio,
                              controller.signal,
                              range
                          ),
                          log: ""
                      }
                    : await runTool(
                          makeRequest(
                              operation,
                              settings,
                              data,
                              range,
                              duration
                          ),
                          controller.signal,
                          setBusy
                      );
            if (controller.signal.aborted) return;
            const next: Result = {
                name: resultFilename(source.name, operation),
                data: output.data,
                operation,
                sampleRate: source.audio.sampleRate,
                log: output.log
            };
            if (analysis) {
                // A readable file remains downloadable even if its plot is unavailable.
                try {
                    next.plot = analysisPlot(
                        operation as AnalysisOperation,
                        output.data,
                        duration
                    );
                } catch {
                    setError(
                        "The analysis file is ready, but its plot could not be drawn."
                    );
                }
            } else
                next.audio = await decodeAudio(output.data, controller.signal);
            if (controller.signal.aborted) return;
            setResult(next);
            setPreview("result");
        } catch (failure) {
            if (!controller.signal.aborted)
                setError(
                    failure instanceof Error
                        ? failure.message
                        : "Could not process this audio."
                );
        } finally {
            if (!controller.signal.aborted) setBusy("");
        }
    };
    /** Load pvlook only when the user requests frequency bins for a spectrum frame. */
    const inspect = async () => {
        if (!result || active) return;
        const controller = new AbortController();
        job.current = controller;
        setBusy("Loading frequency bins…");
        setError("");
        try {
            const output = await runTool(
                inspectFrame(result.data, frameTime),
                controller.signal,
                setBusy
            );
            if (!controller.signal.aborted)
                setBins(binPlot(output.data, result.sampleRate));
        } catch (failure) {
            if (!controller.signal.aborted)
                setError(
                    failure instanceof Error
                        ? failure.message
                        : "Could not inspect this frame."
                );
        } finally {
            if (!controller.signal.aborted) setBusy("");
        }
    };
    /** Download the current result and release its temporary URL. */
    const download = () => {
        if (!result) return;
        const url = URL.createObjectURL(new Blob([result.data]));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = result.name;
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
                disabled={active}
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
                defaultValue={settings[key]}
                min={min}
                max={max}
                step={1}
                disabled={active}
                onChangeCommitted={(_, value) =>
                    changeSetting(key, value as number)
                }
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
                "& audio": {
                    display: "block",
                    width: "100%",
                    height: 36,
                    colorScheme: theme.mode
                },
                "& output": { fontFamily: theme.font.monospace },
                "& p": { fontSize: 12, lineHeight: 1.5, margin: 0 },
                "& fieldset": { border: 0, padding: 0, margin: 0, minWidth: 0 },
                "@media (prefers-reduced-motion: reduce)": {
                    "& .MuiLinearProgress-bar": { animation: "none" }
                }
            }}
        >
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
                    <select
                        aria-label="Project audio file"
                        value=""
                        disabled={active || !sources.length}
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
                    </select>
                </label>
                <Button
                    variant="outlined"
                    startIcon={<UploadFileRounded />}
                    disabled={active}
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
            {source && !loading && (
                <div
                    css={{
                        padding: 16,
                        display: "grid",
                        gap: 16,
                        "@container (min-width: 850px)": {
                            gridTemplateColumns: result
                                ? "minmax(0, 1fr) minmax(0, 1fr)"
                                : "minmax(0, 1fr)"
                        }
                    }}
                >
                    <div
                        css={{
                            display: "grid",
                            gap: 16,
                            alignContent: "start",
                            minWidth: 0
                        }}
                    >
                        <div
                            css={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "space-between",
                                gap: 8,
                                fontSize: 11,
                                color: theme.altTextColor
                            }}
                        >
                            <span
                                css={{
                                    overflowWrap: "anywhere",
                                    color: theme.textColor
                                }}
                            >
                                {source.name}
                            </span>
                            <span>
                                {duration.toFixed(2)} s /{" "}
                                {source.audio.sampleRate.toLocaleString()} Hz /{" "}
                                {source.audio.channels.length === 1
                                    ? "Mono"
                                    : `${source.audio.channels.length} channels`}
                            </span>
                        </div>
                        <Waveform
                            audio={source.audio}
                            range={selectRange ? range : undefined}
                            onSelect={
                                selectRange
                                    ? (value) => {
                                          setRange(value);
                                          resetResult();
                                      }
                                    : undefined
                            }
                            disabled={active}
                            gain={operation === "gain" ? settings.gain : 0}
                        />
                        <audio
                            key={sourceUrl}
                            controls
                            preload="metadata"
                            src={sourceUrl}
                            aria-label="Original audio"
                        />
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
                                    disabled={active}
                                    aria-pressed={operation === choice.id}
                                    onClick={() => {
                                        setOperation(choice.id);
                                        resetResult();
                                    }}
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
                                choices.find(
                                    (choice) => choice.id === operation
                                )?.hint
                            }
                        </p>
                        <fieldset
                            disabled={active}
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
                                                    setRange([value, range[1]]);
                                                    resetResult();
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
                                                    setRange([range[0], value]);
                                                    resetResult();
                                                }
                                            }}
                                        />
                                    </label>
                                    <div css={{ alignSelf: "flex-end" }}>
                                        <Button
                                            disabled={active}
                                            onClick={() => {
                                                setRange([0, duration]);
                                                resetResult();
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
                                slider(
                                    "Noise reduction",
                                    "reduction",
                                    6,
                                    60,
                                    "dB"
                                )}
                            {operation === "resample" && (
                                <label>
                                    Sample rate
                                    <select
                                        value={settings.rate}
                                        onChange={(event) =>
                                            changeSetting(
                                                "rate",
                                                Number(event.target.value)
                                            )
                                        }
                                    >
                                        {[
                                            8000, 16000, 22050, 32000, 44100,
                                            48000, 88200, 96000
                                        ].map((rate) => (
                                            <option key={rate} value={rate}>
                                                {rate.toLocaleString()} Hz
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                            {analysis && source.audio.channels.length > 1 && (
                                <label>
                                    Channel
                                    <select
                                        value={channel}
                                        onChange={(event) => {
                                            setChannel(
                                                Number(event.target.value)
                                            );
                                            resetResult();
                                        }}
                                    >
                                        {source.audio.channels.map(
                                            (_, index) => (
                                                <option
                                                    key={index}
                                                    value={index}
                                                >
                                                    Channel {index + 1}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>
                            )}
                            {operation === "spectrum" && (
                                <label>
                                    Frequency detail
                                    <select
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
                                    </select>
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
                        {operation === "gain" && (
                            <p css={{ color: theme.altTextColor }}>
                                The waveform previews the gain. Apply to hear
                                the result.
                            </p>
                        )}
                        <div
                            css={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12
                            }}
                        >
                            <Button
                                variant="outlined"
                                disabled={active}
                                onClick={() => void run()}
                                css={{
                                    "&&": {
                                        borderColor: theme.tabHighlightActive,
                                        fontWeight: 600
                                    }
                                }}
                            >
                                {analysis ? "Analyze" : "Apply"}
                            </Button>
                            {busy && (
                                <>
                                    <Button onClick={cancel}>Cancel</Button>
                                    <span role="status" css={{ fontSize: 12 }}>
                                        {busy}
                                    </span>
                                </>
                            )}
                        </div>
                        {busy && (
                            <LinearProgress
                                aria-label="Audio processing"
                                css={{
                                    background: theme.line,
                                    "& .MuiLinearProgress-bar": {
                                        background: theme.tabHighlightActive
                                    }
                                }}
                            />
                        )}
                    </div>
                    {result && (
                        <div
                            css={{
                                display: "grid",
                                gap: 12,
                                paddingTop: 16,
                                borderTop: `1px solid ${theme.line}`,
                                minWidth: 0,
                                alignContent: "start",
                                "@container (min-width: 850px)": {
                                    borderTop: 0,
                                    paddingTop: 0,
                                    borderLeft: `1px solid ${theme.line}`,
                                    paddingLeft: 16
                                }
                            }}
                        >
                            <div
                                role="status"
                                css={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    overflowWrap: "anywhere"
                                }}
                            >
                                {result.name}
                            </div>
                            {result.audio && (
                                <>
                                    <div
                                        role="group"
                                        aria-label="Compare audio"
                                    >
                                        <Button
                                            aria-pressed={
                                                preview === "original"
                                            }
                                            onClick={() =>
                                                setPreview("original")
                                            }
                                        >
                                            Original
                                        </Button>
                                        <Button
                                            aria-pressed={preview === "result"}
                                            onClick={() => setPreview("result")}
                                        >
                                            Result
                                        </Button>
                                    </div>
                                    <Waveform
                                        audio={
                                            preview === "result"
                                                ? result.audio
                                                : source.audio
                                        }
                                    />
                                    <audio
                                        key={
                                            preview === "result"
                                                ? resultUrl
                                                : sourceUrl
                                        }
                                        controls
                                        preload="metadata"
                                        src={
                                            preview === "result"
                                                ? resultUrl
                                                : sourceUrl
                                        }
                                        aria-label="Preview audio"
                                    />
                                    <p css={{ color: theme.altTextColor }}>
                                        {durationOf(result.audio).toFixed(2)} s
                                        /{" "}
                                        {result.audio.sampleRate.toLocaleString()}{" "}
                                        Hz
                                    </p>
                                </>
                            )}
                            {result.plot && (
                                <AnalysisGraph plot={result.plot} />
                            )}
                            {result.operation === "spectrum" && (
                                <details>
                                    <summary
                                        css={{
                                            fontSize: 12,
                                            cursor: "pointer"
                                        }}
                                    >
                                        Inspect frequency bins
                                    </summary>
                                    <div
                                        css={{
                                            display: "flex",
                                            alignItems: "flex-end",
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
                                                disabled={active}
                                                onChange={(event) => {
                                                    const value =
                                                        event.target
                                                            .valueAsNumber;
                                                    if (
                                                        Number.isFinite(
                                                            value
                                                        ) &&
                                                        value >= 0 &&
                                                        value <= duration
                                                    ) {
                                                        setFrameTime(value);
                                                        setBins(undefined);
                                                    }
                                                }}
                                            />
                                        </label>
                                        <Button
                                            disabled={active}
                                            variant="outlined"
                                            onClick={() => void inspect()}
                                        >
                                            Inspect
                                        </Button>
                                    </div>
                                    {bins && <AnalysisGraph plot={bins} />}
                                </details>
                            )}
                            <div
                                css={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 8
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    startIcon={<SaveRounded />}
                                    disabled={Boolean(saved)}
                                    onClick={() => {
                                        try {
                                            setSaved(onSave(result));
                                        } catch {
                                            setError(
                                                "Could not save the result. Download it or try again."
                                            );
                                        }
                                    }}
                                >
                                    Keep result
                                </Button>
                                <Button
                                    startIcon={<DownloadRounded />}
                                    onClick={download}
                                >
                                    Download
                                </Button>
                            </div>
                            {saved && (
                                <p role="status">
                                    Added {saved} to the file tree. Project
                                    owners can use its upload button to save it.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
            {error && (
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
                        overflowWrap: "anywhere",
                        maxHeight: 160,
                        overflow: "auto"
                    }}
                >
                    {error}
                </div>
            )}
        </section>
    );
}
