import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@emotion/react";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import { decodeAudio, durationOf } from "../audio-tools/audio";
import type { LoadedAudio } from "../audio-tools/preview";
import type { AudioData, ToolFile } from "../audio-tools/types";
import { readAudioStream } from "../audio-tools/limits";
import { useDebouncedTask } from "../audio-tools/use-debounced-task";
import { useAudioUrl } from "../audio-tools/use-audio-url";
import { WavePlayer } from "../audio-tools/wave-player";
import { spliceAudio } from "./splice";

export default function SpliceTool({
    source,
    selection,
    peaks,
    onSave
}: {
    source: LoadedAudio;
    selection?: [number, number];
    peaks?: [number, number][];
    onSave: (file: ToolFile) => string;
}) {
    const theme = useTheme();
    const duration = durationOf(source.audio);
    const [range, setRange] = useState<[number, number]>(
        selection ?? [duration, duration]
    );
    const [insert, setInsert] = useState<{ name: string; audio: AudioData }>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState("");
    const job = useRef<AbortController>();
    const input = useRef<HTMLInputElement>(null);
    useEffect(() => () => job.current?.abort(), []);
    const changed = range[0] !== range[1] || Boolean(insert);
    const request = useMemo(
        () =>
            changed && !loading
                ? { audio: source.audio, range, insert: insert?.audio }
                : undefined,
        [changed, loading, source, range, insert]
    );
    const preview = useDebouncedTask(request, spliceAudio);
    const output = changed ? preview.value : source;
    const url = useAudioUrl(output?.data);
    const pending = loading || preview.pending;
    const ready = !pending && !preview.error && !error && output;
    const filename = `${source.name.replace(/\.[^.]+$/, "")}-${insert ? "spliced" : "cut"}.wav`;
    const reset = () => {
        job.current?.abort();
        setLoading(false);
        setRange([duration, duration]);
        setInsert(undefined);
        setError("");
        setSaved("");
    };
    return (
        <section
            aria-label="Cut and splice"
            css={{
                padding: 20,
                height: "100%",
                boxSizing: "border-box",
                overflow: "auto",
                color: theme.textColor,
                background: theme.background,
                "& input[type=number]": {
                    display: "block",
                    marginTop: 6,
                    width: 130,
                    maxWidth: "100%",
                    padding: 8,
                    color: theme.textColor,
                    background: theme.textFieldBackground,
                    border: `1px solid ${theme.line}`,
                    borderRadius: 4
                },
                "& button": { textTransform: "none" },
                "& .MuiButton-root": { color: theme.textColor },
                "& .Mui-disabled": { color: theme.disabledTextColor },
                "& .MuiLinearProgress-bar": {
                    background: theme.tabHighlightActive
                },
                "& button:focus-visible, & input:focus-visible": {
                    outline: `2px solid ${theme.textColor}`,
                    outlineOffset: 2
                },
                "@media (prefers-reduced-motion: reduce)": {
                    "& .MuiLinearProgress-bar": { animation: "none" }
                }
            }}
        >
            <h2 css={{ fontSize: 17, margin: "0 0 8px" }}>Cut / splice</h2>
            <p css={{ fontSize: 13, color: theme.altTextColor }}>
                Remove a section, or replace it with another clip. Use the same
                start and end time to insert without cutting. Times refer to the
                source file.
            </p>
            {pending && <LinearProgress aria-label="Updating splice" />}
            <WavePlayer
                key={url}
                audio={output?.audio ?? source.audio}
                peaks={preview.value?.peaks ?? peaks}
                src={url}
                label="Splice"
                playbackDisabled={!ready}
            />
            <div
                css={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 16,
                    margin: "20px 0",
                    fontSize: 13
                }}
            >
                {(["Start (seconds)", "End (seconds)"] as const).map(
                    (label, index) => (
                        <label key={label}>
                            {label}
                            <input
                                type="number"
                                min={0}
                                max={duration}
                                step={0.001}
                                value={
                                    Number.isFinite(range[index])
                                        ? range[index]
                                        : ""
                                }
                                onChange={(event) => {
                                    setSaved("");
                                    setRange((current) =>
                                        index === 0
                                            ? [
                                                  event.target.valueAsNumber,
                                                  current[1]
                                              ]
                                            : [
                                                  current[0],
                                                  event.target.valueAsNumber
                                              ]
                                    );
                                }}
                            />
                        </label>
                    )
                )}
            </div>
            <input
                ref={input}
                type="file"
                accept="audio/*,.wav,.aif,.aiff,.flac"
                hidden
                onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    job.current?.abort();
                    const controller = new AbortController();
                    job.current = controller;
                    setLoading(true);
                    setError("");
                    setSaved("");
                    setInsert(undefined);
                    try {
                        const bytes = await readAudioStream(
                            file.stream(),
                            controller.signal,
                            file.size
                        );
                        const audio = await decodeAudio(
                            bytes,
                            controller.signal
                        );
                        controller.signal.throwIfAborted();
                        setInsert({ name: file.name, audio });
                    } catch (cause) {
                        if (!controller.signal.aborted)
                            setError(
                                cause instanceof Error
                                    ? cause.message
                                    : "Could not read this clip."
                            );
                    } finally {
                        if (!controller.signal.aborted) setLoading(false);
                    }
                }}
            />
            <div css={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <Button
                    startIcon={<UploadFileRounded />}
                    onClick={() => input.current?.click()}
                >
                    Insert clip
                </Button>
                {insert && (
                    <Button
                        onClick={() => {
                            setInsert(undefined);
                            setSaved("");
                        }}
                    >
                        Remove inserted clip
                    </Button>
                )}
                <Button onClick={reset}>Clear all changes</Button>
            </div>
            <p aria-live="polite" css={{ fontSize: 13 }}>
                {changed
                    ? `Remove ${range[0].toFixed(3)} to ${range[1].toFixed(3)} s`
                    : "No changes. Insert a clip or choose a section to cut"}
                {insert
                    ? `; insert ${insert.name} (${durationOf(insert.audio).toFixed(3)} s)`
                    : ""}
                .
            </p>
            {(error || preview.error) && (
                <p role="alert" css={{ color: theme.errorText }}>
                    {error || preview.error}
                </p>
            )}
            <div css={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <Button
                    startIcon={<SaveRounded />}
                    disabled={!ready || Boolean(saved)}
                    onClick={() => {
                        if (!ready) return;
                        try {
                            setSaved(
                                onSave({ name: filename, data: ready.data })
                            );
                        } catch {
                            setError(
                                "Could not add the result to the project."
                            );
                        }
                    }}
                >
                    Add to project
                </Button>
                <Button
                    component="a"
                    href={ready ? url : undefined}
                    download={filename}
                    disabled={!ready}
                    startIcon={<DownloadRounded />}
                >
                    Download
                </Button>
            </div>
            {saved && (
                <p role="status">
                    Added {saved} to the file tree. Use its upload button to
                    save it to the project.
                </p>
            )}
        </section>
    );
}
