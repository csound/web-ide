import { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import { AudioSelect } from "./audio-select";
import { decodeAudio, durationOf, encodeAudioAsync } from "./audio";
import { readAudioStream } from "./limits";
import type { AudioSource } from "./audio-tool";
import type { LoadedAudio } from "./preview";

/** Load either project or local audio, cancelling stale loads when the choice changes. */
export function ImpulseInput({
    label,
    sources,
    value,
    onChange
}: {
    label: string;
    sources: AudioSource[];
    value?: LoadedAudio;
    onChange: (audio: LoadedAudio | undefined) => void;
}) {
    const job = useRef<AbortController>();
    const input = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => () => job.current?.abort(), []);
    const load = async (
        name: string,
        read: (signal: AbortSignal) => Promise<Uint8Array>
    ) => {
        job.current?.abort();
        const controller = new AbortController();
        job.current = controller;
        setLoading(true);
        setError("");
        onChange(undefined);
        try {
            const bytes = await read(controller.signal);
            const audio = await decodeAudio(bytes, controller.signal);
            const data = await encodeAudioAsync(audio, controller.signal);
            controller.signal.throwIfAborted();
            onChange({ name, audio, data });
        } catch (failure) {
            if (!controller.signal.aborted)
                setError(
                    failure instanceof Error
                        ? failure.message
                        : "Could not read this audio."
                );
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    };
    return (
        <div css={{ display: "grid", gap: 8, minWidth: 0 }}>
            <label>
                {label}
                <AudioSelect
                    aria-label={`${label} project file`}
                    value=""
                    onChange={(event) => {
                        const source = sources.find(
                            (item) => item.id === event.target.value
                        );
                        if (source) void load(source.name, source.load);
                    }}
                >
                    <option value="">Choose project audio…</option>
                    {sources.map((source) => (
                        <option key={source.id} value={source.id}>
                            {source.name}
                        </option>
                    ))}
                </AudioSelect>
            </label>
            <div
                css={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 8
                }}
            >
                <input
                    ref={input}
                    aria-label={`Upload ${label.toLowerCase()}`}
                    type="file"
                    accept="audio/*,.wav,.aif,.aiff,.flac"
                    hidden
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file)
                            void load(file.name, (signal) =>
                                readAudioStream(
                                    file.stream(),
                                    signal,
                                    file.size
                                )
                            );
                    }}
                />
                <Button
                    startIcon={<UploadFileRounded />}
                    onClick={() => input.current?.click()}
                >
                    Open {label.toLowerCase()}
                </Button>
                {loading ? (
                    <>
                        <span role="status">Reading audio…</span>
                        <Button
                            onClick={() => {
                                job.current?.abort();
                                setLoading(false);
                            }}
                        >
                            Cancel
                        </Button>
                    </>
                ) : (
                    value && (
                        <span css={{ overflowWrap: "anywhere" }}>
                            {value.name} · {durationOf(value.audio).toFixed(2)}{" "}
                            s · {value.audio.sampleRate.toLocaleString()} Hz
                        </span>
                    )
                )}
            </div>
            {error && <p role="alert">{error}</p>}
        </div>
    );
}
