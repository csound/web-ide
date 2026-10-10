import { blobFromBytes } from "@root/utils/blob";
import { useMemo, useState } from "react";
import { useTheme } from "@emotion/react";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Slider from "@mui/material/Slider";
import SaveRounded from "@mui/icons-material/SaveRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import { ImpulseInput } from "./impulse-input";
import { AudioSelect } from "./audio-select";
import { WavePlayer } from "./wave-player";
import { EditList } from "./edit-list";
import { useAudioUrl } from "./use-audio-url";
import { useDebouncedTask } from "./use-debounced-task";
import { buildImpulse, sweepDefaults, type ImpulseRequest } from "./impulse";
import { durationOf } from "./audio";
import type { AudioSource } from "./audio-tool";
import type { LoadedAudio } from "./preview";
import type { ToolFile } from "./types";

/** Visual sweep creation, response extraction and convolve preparation with one live preview. */
export default function ImpulseTool({
    mode,
    sources,
    onSave
}: {
    mode: "impulse" | "convolution";
    sources: AudioSource[];
    onSave: (file: ToolFile) => string;
}) {
    const theme = useTheme();
    const convolution = mode === "convolution";
    const [step, setStep] = useState<"sweep" | "extract">("sweep");
    const [settings, setSettings] = useState(sweepDefaults);
    const [sweep, setSweep] = useState<LoadedAudio>();
    const [recording, setRecording] = useState<LoadedAudio>();
    const [source, setSource] = useState<LoadedAudio>();
    const [range, setRange] = useState<[number, number]>([0, 1]);
    const [channel, setChannel] = useState(0);
    const [enabled, setEnabled] = useState(true);
    const [inputEpoch, setInputEpoch] = useState(0);
    const [saved, setSaved] = useState<{ file: ToolFile; name: string }>();
    const [saveError, setSaveError] = useState("");
    const request = useMemo<ImpulseRequest | undefined>(() => {
        if (convolution)
            return source && enabled
                ? { kind: "convolution", source, range, channel }
                : undefined;
        if (step === "sweep") return { kind: "sweep", settings };
        return sweep && recording
            ? { kind: "extract", sweep, recording, channel }
            : undefined;
    }, [
        convolution,
        source,
        enabled,
        range,
        channel,
        step,
        settings,
        sweep,
        recording
    ]);
    const preview = useDebouncedTask(request, buildImpulse);
    const result = preview.value;
    const display = result || (convolution ? source : undefined);
    const url = useAudioUrl(
        result?.playback || (convolution ? source?.data : undefined)
    );
    const ready = Boolean(result && !preview.pending && !preview.error);
    const reset = () => {
        setSettings(sweepDefaults);
        setRange([0, source ? durationOf(source.audio) : 1]);
        setChannel(0);
        setEnabled(false);
        setRecording(undefined);
        setSweep(undefined);
        setInputEpoch((value) => value + 1);
        setSaved(undefined);
        setSaveError("");
    };
    const setSelection = (next: [number, number]) => {
        setRange(next);
        setEnabled(true);
    };
    const rows = convolution
        ? source && enabled
            ? [
                  {
                      id: "prepare",
                      label: "Convolution data",
                      detail: `Channel ${channel + 1} · ${range[0].toFixed(3)}–${range[1].toFixed(3)} s · Portable .cv file`,
                      remove: reset
                  }
              ]
            : []
        : step === "extract"
          ? recording
              ? [
                    {
                        id: "extract",
                        label: "Extract response",
                        detail: `Recording channel ${channel + 1} · ${sweep?.name || "Choose a reference sweep"}`,
                        remove: reset
                    }
                ]
              : []
          : [
                ...(settings.seconds !== sweepDefaults.seconds
                    ? [
                          {
                              id: "duration",
                              label: "Sweep length",
                              detail: `${settings.seconds} seconds`,
                              remove: () =>
                                  setSettings((value) => ({
                                      ...value,
                                      seconds: sweepDefaults.seconds
                                  }))
                          }
                      ]
                    : []),
                ...(settings.rate !== sweepDefaults.rate
                    ? [
                          {
                              id: "rate",
                              label: "Sample rate",
                              detail: `${settings.rate.toLocaleString()} Hz`,
                              remove: () =>
                                  setSettings((value) => ({
                                      ...value,
                                      rate: sweepDefaults.rate
                                  }))
                          }
                      ]
                    : [])
            ];
    const chosen = convolution ? source : recording;
    const offset = convolution && result ? range[0] : 0;
    const download = () => {
        if (!result || !ready) return;
        const link = document.createElement("a");
        const href = URL.createObjectURL(
            blobFromBytes(result.data, {
                type: convolution ? "text/plain" : "audio/wav"
            })
        );
        link.href = href;
        link.download = result.name.replace(/^.*[/\\]/, "");
        link.click();
        setTimeout(() => URL.revokeObjectURL(href), 1000);
    };
    return (
        <section
            aria-label={convolution ? "Convolution Prep" : "Impulse Response"}
            aria-busy={preview.pending}
            css={{
                height: "100%",
                overflow: "auto",
                position: "relative",
                containerType: "inline-size",
                color: theme.textColor,
                background: theme.background,
                fontFamily: theme.font.regular,
                fontSize: 12,
                "& p": { margin: 0, lineHeight: 1.6 },
                "& label": { display: "grid", gap: 8, minWidth: 0 },
                "& select": {
                    width: "100%",
                    minWidth: 130,
                    boxSizing: "border-box",
                    font: "inherit",
                    padding: "7px 8px",
                    border: `1px solid ${theme.line}`,
                    borderRadius: 4,
                    background: theme.textFieldBackground,
                    color: theme.textColor
                },
                "& button:focus-visible, & input:focus-visible, & select:focus-visible":
                    {
                        outline: `2px solid ${theme.textColor}`,
                        outlineOffset: 2
                    },
                "@media (prefers-reduced-motion: reduce)": {
                    "& *, & *::before, & *::after": {
                        animation: "none !important",
                        transition: "none !important"
                    }
                },
                "& input[type=number]": {
                    width: 120,
                    boxSizing: "border-box",
                    padding: 8,
                    border: `1px solid ${theme.line}`,
                    borderRadius: 4,
                    background: theme.background,
                    color: theme.textColor
                },
                "& .MuiButton-root": {
                    textTransform: "none",
                    borderColor: theme.line,
                    fontSize: 12,
                    color: theme.textColor
                },
                "& .Mui-disabled": { opacity: 0.45 },
                "& .MuiSlider-root": { color: theme.tabHighlightActive }
            }}
        >
            <div css={{ height: 3, position: "sticky", top: 0, zIndex: 1 }}>
                {preview.pending && (
                    <LinearProgress aria-label={preview.status} />
                )}
            </div>
            <div css={{ display: "grid", gap: 16, padding: 16, minWidth: 0 }}>
                <div>
                    <h2
                        css={{
                            fontSize: 15,
                            margin: "0 0 6px",
                            fontWeight: 600
                        }}
                    >
                        {convolution
                            ? "Prepare an impulse for convolve"
                            : "Create an impulse response"}
                    </h2>
                    <p css={{ color: theme.altTextColor }}>
                        {convolution
                            ? "Select a response, choose its range, and save a portable .cv file for Csound’s convolve opcode."
                            : "Make a test sweep, then recover a room or device’s response from its recording."}
                    </p>
                </div>
                {!convolution && (
                    <div
                        role="group"
                        aria-label="Impulse response task"
                        css={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 4,
                            borderBottom: `1px solid ${theme.line}`,
                            paddingBottom: 8
                        }}
                    >
                        {(
                            [
                                ["sweep", "Generate sweep"],
                                ["extract", "Extract response"]
                            ] as const
                        ).map(([id, title]) => (
                            <Button
                                key={id}
                                aria-pressed={step === id}
                                onClick={() => {
                                    setStep(id);
                                    setSaved(undefined);
                                    setSaveError("");
                                }}
                                css={
                                    step === id
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
                                {title}
                            </Button>
                        ))}
                    </div>
                )}
                {convolution ? (
                    <ImpulseInput
                        key={inputEpoch}
                        label="Impulse response"
                        sources={sources}
                        value={source}
                        onChange={(value) => {
                            setSource(value);
                            setRange([
                                0,
                                value
                                    ? Math.min(10, durationOf(value.audio))
                                    : 1
                            ]);
                            setChannel(0);
                            setEnabled(true);
                        }}
                    />
                ) : step === "sweep" ? (
                    <>
                        <div
                            css={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 28,
                                alignItems: "center"
                            }}
                        >
                            <label css={{ width: 240, maxWidth: "100%" }}>
                                Sweep length · {settings.seconds} s
                                <Slider
                                    aria-label="Sweep length"
                                    min={0.1}
                                    max={10}
                                    step={0.1}
                                    value={settings.seconds}
                                    valueLabelDisplay="auto"
                                    onChange={(_, value) =>
                                        setSettings((current) => ({
                                            ...current,
                                            seconds: value as number
                                        }))
                                    }
                                />
                            </label>
                            <label>
                                Sample rate
                                <AudioSelect
                                    value={settings.rate}
                                    onChange={(event) =>
                                        setSettings((current) => ({
                                            ...current,
                                            rate: Number(event.target.value)
                                        }))
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
                        </div>
                        <p css={{ color: theme.altTextColor }}>
                            Play the sweep through the space or device you want
                            to measure. Record it at the same sample rate, with
                            room for the sound to decay.
                        </p>
                    </>
                ) : (
                    <>
                        <div
                            key={inputEpoch}
                            css={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(2, minmax(0, 1fr))",
                                gap: 16,
                                "@container (max-width: 560px)": {
                                    gridTemplateColumns: "1fr"
                                }
                            }}
                        >
                            <ImpulseInput
                                label="Reference sweep"
                                sources={sources}
                                value={sweep}
                                onChange={setSweep}
                            />
                            <ImpulseInput
                                label="Recording"
                                sources={sources}
                                value={recording}
                                onChange={(value) => {
                                    setRecording(value);
                                    setChannel(0);
                                }}
                            />
                        </div>
                        <p css={{ color: theme.altTextColor }}>
                            Use the exact mono sweep you played. Align the
                            recording’s start with the sweep; keep between one
                            and two sweep lengths. The result is one sweep
                            length. Use Sample Editor to trim or align first.
                        </p>
                    </>
                )}
                {chosen &&
                    chosen.audio.channels.length > 1 &&
                    (convolution || step === "extract") && (
                        <label css={{ width: 200 }}>
                            {convolution
                                ? "Response channel"
                                : "Recording channel"}
                            <AudioSelect
                                aria-label="Audio channel"
                                value={channel}
                                onChange={(event) => {
                                    setChannel(Number(event.target.value));
                                    setEnabled(true);
                                }}
                            >
                                {chosen.audio.channels.map((_, index) => (
                                    <option key={index} value={index}>
                                        Channel {index + 1}
                                    </option>
                                ))}
                            </AudioSelect>
                        </label>
                    )}
                {display ? (
                    <>
                        <div
                            css={{
                                display: "flex",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: 8
                            }}
                        >
                            <strong css={{ overflowWrap: "anywhere" }}>
                                {display.name}
                            </strong>
                            <span css={{ color: theme.altTextColor }}>
                                {durationOf(display.audio).toFixed(3)} s ·{" "}
                                {display.audio.sampleRate.toLocaleString()} Hz ·
                                {display.audio.channels.length === 1
                                    ? "Mono"
                                    : `${display.audio.channels.length} channels`}
                            </span>
                        </div>
                        <WavePlayer
                            audio={display.audio}
                            src={url}
                            label={convolution ? "Impulse preview" : "Preview"}
                            playbackDisabled={
                                preview.pending || Boolean(preview.error)
                            }
                            range={
                                convolution
                                    ? [
                                          Math.max(0, range[0] - offset),
                                          Math.min(
                                              durationOf(display.audio),
                                              range[1] - offset
                                          )
                                      ]
                                    : undefined
                            }
                            onSelect={
                                convolution
                                    ? (next) =>
                                          setSelection([
                                              next[0] + offset,
                                              next[1] + offset
                                          ])
                                    : undefined
                            }
                        />
                        {convolution && (
                            <p css={{ color: theme.altTextColor }}>
                                Listen to the selected impulse. The .cv download
                                contains convolution data, not playable audio.
                            </p>
                        )}
                    </>
                ) : (
                    <div
                        css={{
                            minHeight: 130,
                            display: "grid",
                            placeItems: "center",
                            border: `1px dashed ${theme.line}`,
                            color: theme.altTextColor
                        }}
                    >
                        <p role="status">
                            {preview.pending
                                ? preview.status
                                : convolution
                                  ? "Open an impulse response to see its waveform."
                                  : "Choose the reference sweep and recording to recover their response."}
                        </p>
                    </div>
                )}
                {convolution && source && (
                    <div css={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                        {(["Start", "End"] as const).map((label, index) => (
                            <label key={label}>
                                {label} (seconds)
                                <input
                                    aria-label={`Impulse ${label.toLowerCase()}`}
                                    type="number"
                                    min={0}
                                    max={durationOf(source.audio)}
                                    step={0.001}
                                    value={range[index]}
                                    onChange={(event) => {
                                        const value =
                                            event.target.valueAsNumber;
                                        if (Number.isFinite(value))
                                            setSelection(
                                                index === 0
                                                    ? [value, range[1]]
                                                    : [range[0], value]
                                            );
                                    }}
                                />
                            </label>
                        ))}
                    </div>
                )}
                <EditList
                    rows={rows}
                    emptyText={
                        convolution
                            ? "Choose a range or channel to prepare convolution data."
                            : step === "sweep"
                              ? "Adjust the sweep length or sample rate to update the preview."
                              : "Choose the reference sweep and recording above."
                    }
                    status={
                        preview.pending
                            ? preview.status
                            : preview.error
                              ? "Preview unavailable. Check the inputs or retry."
                              : !convolution && step === "sweep" && !rows.length
                                ? "Preview uses the default sweep settings."
                                : !convolution && !recording
                                  ? "No response extracted yet."
                                  : convolution && !source
                                    ? "Open an impulse response to begin."
                                    : undefined
                    }
                    onClear={reset}
                />
                {!convolution && step === "sweep" && (
                    <p css={{ color: theme.altTextColor }}>
                        Current sweep: {settings.seconds} s ·{" "}
                        {settings.rate.toLocaleString()} Hz · mono
                    </p>
                )}
                {preview.error && (
                    <div
                        role="alert"
                        css={{
                            color: theme.errorText,
                            overflowWrap: "anywhere"
                        }}
                    >
                        {preview.error}
                        <Button onClick={preview.retry}>Retry</Button>
                    </div>
                )}
                <div css={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Button
                        variant="outlined"
                        startIcon={<SaveRounded />}
                        disabled={!ready || saved?.file === result}
                        onClick={() => {
                            if (!result || !ready) return;
                            try {
                                setSaved({
                                    file: result,
                                    name: onSave(result)
                                });
                                setSaveError("");
                            } catch {
                                setSaveError(
                                    "Could not save this file. Download it or try again."
                                );
                            }
                        }}
                    >
                        Add to project
                    </Button>
                    <Button
                        startIcon={<DownloadRounded />}
                        disabled={!ready}
                        onClick={download}
                    >
                        Download
                    </Button>
                    {!convolution && step === "sweep" && (
                        <Button
                            disabled={!ready}
                            onClick={() => {
                                if (result) {
                                    setSweep(result);
                                    setStep("extract");
                                    setChannel(0);
                                }
                            }}
                        >
                            Use as reference sweep
                        </Button>
                    )}
                </div>
                {saved?.file === result && saved && (
                    <p role="status">
                        Added {saved.name} to the file tree. Project owners can
                        use its upload button to save it.
                    </p>
                )}
                {saveError && <p role="alert">{saveError}</p>}
            </div>
        </section>
    );
}
