import { blobFromBytes } from "@root/utils/blob";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useTheme } from "@emotion/react";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ContentCutRounded from "@mui/icons-material/ContentCutRounded";
import CallMergeRounded from "@mui/icons-material/CallMergeRounded";
import SpeedRounded from "@mui/icons-material/SpeedRounded";
import GraphicEqRounded from "@mui/icons-material/GraphicEqRounded";
import TuneRounded from "@mui/icons-material/TuneRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import VolumeUpRounded from "@mui/icons-material/VolumeUpRounded";
import CleaningServicesRounded from "@mui/icons-material/CleaningServicesRounded";
import {
    decodeAudio,
    durationOf,
    encodeAudioAsync
} from "../audio-tools/audio";
import { checkAudioLayout, readAudioStream } from "../audio-tools/limits";
import { WavePlayer } from "../audio-tools/wave-player";
import type { AudioData, ToolFile } from "../audio-tools/types";
import type { Operation } from "../audio-tools/operations";
import type { LoadedAudio } from "../audio-tools/preview";
import type { AudioInfo, InfoRow } from "./metadata";
import { inspectMetadata, scanAudio, type AudioScan } from "./inspect";

const SpliceTool = lazy(() => import("./splice-tool"));
const AudioTool = lazy(() => import("../audio-tools/audio-tool"));
type ToolChoice = {
    operation: Operation | "splice";
    label: string;
    Icon: typeof ContentCutRounded;
    mode: "sample" | "analysis";
};
const splice: ToolChoice = {
    operation: "splice",
    label: "Cut / splice",
    Icon: CallMergeRounded,
    mode: "sample"
};
const trim: ToolChoice = {
    operation: "trim",
    label: "Trim",
    Icon: ContentCutRounded,
    mode: "sample"
};
const resample: ToolChoice = {
    operation: "resample",
    label: "Resample",
    Icon: SpeedRounded,
    mode: "sample"
};
const normalize: ToolChoice = {
    operation: "normalize",
    label: "Normalize",
    Icon: VolumeUpRounded,
    mode: "sample"
};
const gain: ToolChoice = {
    operation: "gain",
    label: "Gain",
    Icon: TuneRounded,
    mode: "sample"
};
const spectrum: ToolChoice = {
    operation: "spectrum",
    label: "Spectrum",
    Icon: GraphicEqRounded,
    mode: "analysis"
};
const denoise: ToolChoice = {
    operation: "denoise",
    label: "Reduce noise",
    Icon: CleaningServicesRounded,
    mode: "sample"
};
const number = (value?: number, suffix = "", digits = 0) =>
    value !== undefined && Number.isFinite(value)
        ? `${value.toLocaleString(undefined, { maximumFractionDigits: digits })}${suffix}`
        : "Not reported";
const level = (amplitude: number) =>
    amplitude === 0
        ? "Silence"
        : `${(20 * Math.log10(amplitude)).toFixed(2)} dBFS`;

/** Stop native fallback playback when the file closes or another view replaces it. */
function FallbackAudio({ src }: { src: string }) {
    const media = useRef<HTMLAudioElement>(null);
    useEffect(() => {
        const element = media.current;
        return () => {
            element?.pause();
        };
    }, []);
    return (
        <audio
            ref={media}
            src={src}
            controls
            preload="metadata"
            aria-label="Sample audio"
            css={{ width: "100%", marginTop: 8 }}
        />
    );
}

/** A file-scoped audio workspace: no utility sidebar or global selection changes. */
export function AudioFilePreview({
    url,
    filename,
    onSave
}: {
    url: string;
    filename: string;
    onSave: (file: ToolFile) => string;
}) {
    const theme = useTheme();
    const [attempt, setAttempt] = useState(0);
    const [info, setInfo] = useState<AudioInfo>();
    const [size, setSize] = useState<number>();
    const [playbackUrl, setPlaybackUrl] = useState(url);
    const [audio, setAudio] = useState<AudioData>();
    const [scan, setScan] = useState<AudioScan>();
    const [loading, setLoading] = useState(true);
    const [notice, setNotice] = useState("");
    const [metadataNotice, setMetadataNotice] = useState("");
    const [range, setRange] = useState<[number, number]>();
    const [tool, setTool] = useState<{
        choice: ToolChoice;
        source: LoadedAudio;
        range?: [number, number];
    }>();
    const [opening, setOpening] = useState(false);
    const preparation = useRef<AbortController>();
    const prepared = useRef<LoadedAudio>();
    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;
        let localUrl: string | undefined;
        const run = async () => {
            setLoading(true);
            setAudio(undefined);
            setScan(undefined);
            setInfo(undefined);
            setRange(undefined);
            prepared.current = undefined;
            setNotice("");
            setMetadataNotice("");
            try {
                const response = await fetch(url, { signal });
                if (!response.ok || !response.body)
                    throw new Error("Could not read this audio file.");
                const bytes = await readAudioStream(
                    response.body,
                    signal,
                    Number(response.headers.get("content-length"))
                );
                signal.throwIfAborted();
                setSize(bytes.length);
                localUrl = URL.createObjectURL(
                    blobFromBytes(bytes, {
                        type:
                            response.headers.get("content-type") ||
                            "application/octet-stream"
                    })
                );
                setPlaybackUrl(localUrl);
                // Metadata failure must not prevent browser playback or decoding.
                const metadata = inspectMetadata(bytes, signal)
                    .then((value) => {
                        if (!signal.aborted) setInfo(value);
                        return value;
                    })
                    .catch(() => {
                        if (!signal.aborted)
                            setMetadataNotice(
                                "Some file metadata could not be read."
                            );
                        return undefined;
                    });
                const sourceInfo = await metadata;
                signal.throwIfAborted();
                if (sourceInfo?.frames && sourceInfo.channels)
                    checkAudioLayout(sourceInfo.frames, sourceInfo.channels);
                const decoded = await decodeAudio(bytes, signal);
                const scanned = await scanAudio(decoded, signal);
                signal.throwIfAborted();
                setAudio(decoded);
                setScan(scanned);
            } catch (error) {
                if (!signal.aborted)
                    setNotice(
                        error instanceof Error
                            ? error.message
                            : "The waveform is unavailable."
                    );
            } finally {
                if (!signal.aborted) setLoading(false);
            }
        };
        void run();
        return () => {
            controller.abort();
            if (localUrl) URL.revokeObjectURL(localUrl);
            preparation.current?.abort();
        };
    }, [url, attempt]);
    const open = async (choice: ToolChoice) => {
        if (!audio || opening) return;
        preparation.current?.abort();
        const controller = new AbortController();
        preparation.current = controller;
        setOpening(true);
        try {
            const source = prepared.current ?? {
                name: filename,
                audio,
                data: await encodeAudioAsync(audio, controller.signal)
            };
            controller.signal.throwIfAborted();
            prepared.current = source;
            setTool({
                choice,
                source,
                range: ["trim", "splice", "denoise"].includes(choice.operation)
                    ? range
                    : undefined
            });
        } catch (error) {
            if (!controller.signal.aborted)
                setNotice(
                    error instanceof Error
                        ? error.message
                        : "Could not open the tool."
                );
        } finally {
            if (!controller.signal.aborted) setOpening(false);
        }
    };
    const action = (choice: ToolChoice) => (
        <Button
            size="small"
            startIcon={<choice.Icon fontSize="small" />}
            disabled={!audio || opening}
            onClick={() => void open(choice)}
            css={{
                whiteSpace: "nowrap",
                color: theme.tabHighlightActive,
                textTransform: "none"
            }}
        >
            {choice.label}
        </Button>
    );
    const table = (
        label: string,
        rows: (InfoRow & { tool?: ToolChoice })[]
    ) => (
        <table
            aria-label={label}
            css={{
                width: "100%",
                tableLayout: "fixed",
                borderCollapse: "collapse",
                fontSize: 13,
                marginTop: 16,
                "& caption": {
                    textAlign: "left",
                    fontWeight: 600,
                    padding: "12px 0",
                    color: theme.textColor
                },
                "& th": {
                    width: "30%",
                    fontWeight: 400,
                    color: theme.altTextColor,
                    textAlign: "left"
                },
                "& td, & th": {
                    padding: "8px 0",
                    verticalAlign: "top",
                    overflowWrap: "anywhere"
                },
                "& tr:nth-of-type(even)": { background: theme.headerBackground }
            }}
        >
            <caption>{label}</caption>
            <tbody>
                {rows.map(({ label: title, value, tool: suggestion }) => (
                    <tr key={title}>
                        <th scope="row">{title}</th>
                        <td>
                            <div
                                css={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 8,
                                    flexWrap: "wrap"
                                }}
                            >
                                <span
                                    css={{
                                        fontFamily: theme.font.monospace,
                                        whiteSpace: "pre-wrap",
                                        minWidth: 0
                                    }}
                                >
                                    {value}
                                </span>
                                {suggestion && action(suggestion)}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
    return (
        <section
            aria-label="Audio file"
            css={{
                height: "100%",
                minHeight: 0,
                overflow: "auto",
                background: theme.background,
                color: theme.textColor,
                fontFamily: theme.font.regular
            }}
        >
            {tool ? (
                <div
                    css={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column"
                    }}
                >
                    <div
                        css={{
                            padding: "8px 16px",
                            borderBottom: `1px solid ${theme.line}`,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            flexWrap: "wrap"
                        }}
                    >
                        <Button
                            startIcon={<ArrowBackRounded />}
                            onClick={() => setTool(undefined)}
                            css={{
                                color: theme.textColor,
                                textTransform: "none"
                            }}
                        >
                            File details
                        </Button>
                        <span css={{ fontSize: 12, overflowWrap: "anywhere" }}>
                            {filename}
                        </span>
                    </div>
                    <div css={{ flex: 1, minHeight: 0 }}>
                        <Suspense fallback={<p role="status">Opening tool…</p>}>
                            {tool.choice.operation === "splice" ? (
                                <SpliceTool
                                    source={tool.source}
                                    selection={tool.range}
                                    peaks={scan?.peaks}
                                    onSave={onSave}
                                />
                            ) : (
                                <AudioTool
                                    mode={tool.choice.mode}
                                    onSave={onSave}
                                    initial={{
                                        source: tool.source,
                                        operation: tool.choice.operation,
                                        range: tool.range
                                    }}
                                />
                            )}
                        </Suspense>
                    </div>
                </div>
            ) : (
                <div
                    css={{
                        padding: "20px clamp(12px, 3vw, 32px)",
                        maxWidth: 1000,
                        margin: "0 auto"
                    }}
                >
                    <header
                        css={{
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            marginBottom: 16
                        }}
                    >
                        <h2
                            css={{
                                margin: 0,
                                fontSize: 17,
                                fontWeight: 600,
                                overflowWrap: "anywhere",
                                minWidth: 0
                            }}
                        >
                            {filename}
                        </h2>
                        <Button
                            component="a"
                            href={playbackUrl}
                            download={filename}
                            size="small"
                            startIcon={<DownloadRounded />}
                            css={{
                                color: theme.textColor,
                                textTransform: "none"
                            }}
                        >
                            Download
                        </Button>
                    </header>
                    {audio && scan ? (
                        <WavePlayer
                            audio={audio}
                            peaks={scan.peaks}
                            src={playbackUrl}
                            label="Sample"
                            range={range}
                            onSelect={setRange}
                            showSpeed
                        />
                    ) : (
                        <div>
                            {loading && (
                                <div
                                    role="status"
                                    aria-label="Reading audio file"
                                >
                                    <Skeleton
                                        variant="rectangular"
                                        animation={false}
                                        height={156}
                                    />
                                    <p css={{ fontSize: 12 }}>
                                        Reading waveform and file details…
                                    </p>
                                </div>
                            )}
                            {!loading && <FallbackAudio src={playbackUrl} />}
                        </div>
                    )}
                    <div
                        css={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            alignItems: "center",
                            marginTop: 8
                        }}
                    >
                        {action(trim)}
                        {action(splice)}
                        {action(denoise)}
                        {range && (
                            <>
                                <span
                                    css={{
                                        fontFamily: theme.font.monospace,
                                        fontSize: 12
                                    }}
                                >
                                    {range[0].toFixed(3)} to{" "}
                                    {range[1].toFixed(3)} s
                                </span>
                                <Button
                                    size="small"
                                    onClick={() => setRange(undefined)}
                                    css={{ color: theme.textColor }}
                                >
                                    Clear selection
                                </Button>
                            </>
                        )}
                    </div>
                    {audio && (
                        <p
                            css={{
                                color: theme.altTextColor,
                                fontSize: 12,
                                margin: "6px 0"
                            }}
                        >
                            Click to seek. Drag to select a range for trimming.
                            Use arrow keys to seek when the waveform has focus.
                        </p>
                    )}
                    {opening && <p role="status">Opening tool…</p>}
                    {notice && (
                        <p
                            role="status"
                            css={{ fontSize: 13, color: theme.altTextColor }}
                        >
                            {notice} Playback may still work.{" "}
                            <Button
                                size="small"
                                onClick={() => setAttempt((value) => value + 1)}
                            >
                                Retry
                            </Button>
                        </p>
                    )}
                    {metadataNotice && <p role="status">{metadataNotice}</p>}
                    {table("File details", [
                        {
                            label: "Format",
                            value:
                                [info?.container, info?.codec]
                                    .filter(Boolean)
                                    .join(" / ") || "Not reported"
                        },
                        {
                            label: "Sample rate",
                            value: number(info?.sampleRate, " Hz"),
                            tool: resample
                        },
                        {
                            label: "Channels",
                            value: info?.channels
                                ? `${info.channels} (${({ 1: "mono", 2: "stereo", 4: "quad", 6: "six channels", 8: "eight channels" } as Record<number, string>)[info.channels] ?? "multichannel"})`
                                : "Not reported",
                            tool: spectrum
                        },
                        {
                            label: "Bit depth",
                            value: number(info?.bits, " bit")
                        },
                        {
                            label: "Duration",
                            value: number(info?.duration, " s", 3)
                        },
                        { label: "Sample frames", value: number(info?.frames) },
                        {
                            label: "Bit rate",
                            value: number(
                                info?.bitrate ? info.bitrate / 1000 : undefined,
                                " kb/s",
                                1
                            )
                        },
                        {
                            label: "File size",
                            value:
                                size === undefined
                                    ? "Not reported"
                                    : `${number(size / 1024 / 1024, " MiB", 2)} (${number(size)} bytes)`
                        }
                    ])}
                    {scan && audio && (
                        <>
                            {table(
                                "Signal levels",
                                scan.channels.flatMap((channel, index) => [
                                    {
                                        label: `Channel ${index + 1} peak`,
                                        value: level(channel.peak),
                                        tool:
                                            index === 0 ? normalize : undefined
                                    },
                                    {
                                        label: `Channel ${index + 1} RMS`,
                                        value: level(channel.rms),
                                        tool: index === 0 ? gain : undefined
                                    },
                                    {
                                        label: `Channel ${index + 1} DC offset`,
                                        value: channel.dc.toFixed(6)
                                    },
                                    {
                                        label: `Channel ${index + 1} full-scale samples`,
                                        value: number(channel.clipped)
                                    }
                                ])
                            )}
                            <p
                                css={{
                                    fontSize: 12,
                                    color: theme.altTextColor
                                }}
                            >
                                Levels use decoded samples at{" "}
                                {number(audio.sampleRate, " Hz")}. Full-scale
                                counts include samples at or above 0 dBFS; they
                                do not prove clipping.{" "}
                                {info?.sampleRate &&
                                info.sampleRate !== audio.sampleRate
                                    ? "The browser resampled this preview; file details above keep the source rate."
                                    : ""}
                            </p>
                        </>
                    )}
                    {info?.instrument.length
                        ? table("Instrument and loops", info.instrument)
                        : null}
                    {info?.broadcast.length
                        ? table("Broadcast metadata", info.broadcast)
                        : null}
                    {info?.tags.length ? table("Tags", info.tags) : null}
                </div>
            )}
        </section>
    );
}
