import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@emotion/react";
import IconButton from "@mui/material/IconButton";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import PauseRounded from "@mui/icons-material/PauseRounded";
import VolumeUpRounded from "@mui/icons-material/VolumeUpRounded";
import VolumeOffRounded from "@mui/icons-material/VolumeOffRounded";
import { Waveform } from "./visuals";
import { durationOf } from "./audio";
import type { AudioData } from "./types";

/** Keep transport controls and an animated playhead on the waveform, without rerendering the editor each frame. */
export function WavePlayer({
    audio,
    src,
    label,
    range,
    onSelect,
    disabled = false,
    playbackDisabled = false,
    peaks,
    showSpeed = false
}: {
    audio: AudioData;
    src?: string;
    label: string;
    range?: [number, number];
    onSelect?: (range: [number, number]) => void;
    disabled?: boolean;
    playbackDisabled?: boolean;
    peaks?: [number, number][];
    showSpeed?: boolean;
}) {
    const theme = useTheme();
    const media = useRef<HTMLAudioElement>(null);
    const playhead = useRef<HTMLDivElement>(null);
    const timeline = useRef<HTMLDivElement>(null);
    const clock = useRef<HTMLOutputElement>(null);
    const alive = useRef(true);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [error, setError] = useState("");
    const duration = durationOf(audio);
    const sync = useCallback(() => {
        const time = Math.min(
            duration,
            Math.max(0, media.current?.currentTime || 0)
        );
        if (playhead.current)
            playhead.current.style.left = `${(time / duration) * 100}%`;
        if (clock.current)
            clock.current.textContent = `${time.toFixed(2)} / ${duration.toFixed(2)} s`;
        timeline.current?.setAttribute("aria-valuenow", time.toFixed(2));
        timeline.current?.setAttribute(
            "aria-valuetext",
            `${time.toFixed(2)} of ${duration.toFixed(2)} seconds`
        );
    }, [duration]);
    useEffect(() => {
        alive.current = true;
        const element = media.current;
        sync();
        return () => {
            alive.current = false;
            element?.pause();
        };
    }, [sync]);
    useEffect(() => {
        if (!playing) return;
        let frame = 0;
        const tick = () => {
            sync();
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [playing, sync]);
    useEffect(() => {
        if (playbackDisabled) media.current?.pause();
    }, [playbackDisabled]);
    const seek = (seconds: number) => {
        if (!media.current) return;
        media.current.currentTime = Math.max(0, Math.min(duration, seconds));
        sync();
    };
    const toggle = async () => {
        const element = media.current;
        if (!element || playbackDisabled) return;
        setError("");
        if (!element.paused) element.pause();
        else {
            if (element.ended) seek(0);
            try {
                await element.play();
            } catch (cause) {
                if (
                    alive.current &&
                    !(
                        cause instanceof DOMException &&
                        cause.name === "AbortError"
                    )
                )
                    setError("Could not play this audio. Try again.");
            }
        }
    };
    return (
        <div
            aria-label={`${label} player`}
            css={{
                border: `1px solid ${theme.line}`,
                borderRadius: 4,
                background: theme.headerBackground,
                overflow: "hidden"
            }}
        >
            <div
                css={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px",
                    flexWrap: "wrap",
                    minHeight: 34
                }}
            >
                <IconButton
                    aria-label={`${playing ? "Pause" : "Play"} ${label.toLowerCase()}`}
                    size="small"
                    disabled={!src || playbackDisabled}
                    onClick={() => void toggle()}
                    css={{ color: theme.textColor }}
                >
                    {playing ? <PauseRounded /> : <PlayArrowRounded />}
                </IconButton>
                <output
                    ref={clock}
                    aria-label={`${label} playback time`}
                    aria-live="off"
                    css={{
                        fontSize: 11,
                        color: theme.altTextColor,
                        flex: 1,
                        whiteSpace: "nowrap"
                    }}
                >
                    0.00 / {duration.toFixed(2)} s
                </output>
                <IconButton
                    aria-label={`${muted ? "Unmute" : "Mute"} ${label.toLowerCase()}`}
                    size="small"
                    onClick={() => {
                        const next = !muted;
                        if (media.current) media.current.muted = next;
                        setMuted(next);
                    }}
                    css={{ color: theme.textColor }}
                >
                    {muted ? (
                        <VolumeOffRounded fontSize="small" />
                    ) : (
                        <VolumeUpRounded fontSize="small" />
                    )}
                </IconButton>
                {showSpeed && (
                    <select
                        aria-label={`${label} playback speed`}
                        defaultValue="1"
                        onChange={(event) => {
                            if (media.current)
                                media.current.playbackRate = Number(
                                    event.target.value
                                );
                        }}
                        css={{
                            color: theme.textColor,
                            background: theme.headerBackground,
                            border: `1px solid ${theme.line}`,
                            borderRadius: 4,
                            fontSize: 12,
                            padding: 4
                        }}
                    >
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                            <option key={rate} value={rate}>
                                {rate}x
                            </option>
                        ))}
                    </select>
                )}
                <input
                    type="range"
                    aria-label={`${label} volume`}
                    min={0}
                    max={1}
                    step={0.01}
                    defaultValue={1}
                    onChange={(event) => {
                        if (media.current) {
                            media.current.volume = event.target.valueAsNumber;
                            media.current.muted = false;
                        }
                        setMuted(false);
                    }}
                    css={{
                        "&&": {
                            width: 64,
                            padding: 0,
                            border: 0,
                            height: 20,
                            accentColor: theme.tabHighlightActive,
                            background: "transparent"
                        }
                    }}
                />
            </div>
            <div
                ref={timeline}
                role="slider"
                tabIndex={0}
                aria-label={`${label} playback position`}
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={0}
                onKeyDown={(event) => {
                    const current = media.current?.currentTime || 0;
                    const step = event.shiftKey ? 5 : 1;
                    if (event.key === " " || event.key === "Enter") {
                        event.preventDefault();
                        void toggle();
                        return;
                    }
                    const next = {
                        ArrowLeft: current - step,
                        ArrowRight: current + step,
                        Home: 0,
                        End: duration
                    }[event.key];
                    if (next !== undefined) {
                        event.preventDefault();
                        seek(next);
                    }
                }}
                css={{
                    position: "relative",
                    outlineOffset: -2,
                    "&:focus-visible": {
                        outline: `2px solid ${theme.textColor}`
                    }
                }}
            >
                <Waveform
                    audio={audio}
                    preparedPeaks={peaks}
                    range={range}
                    onSelect={onSelect}
                    disabled={disabled}
                    onSeek={seek}
                />
                <div
                    ref={playhead}
                    data-testid={`${label.toLowerCase()}-playhead`}
                    aria-hidden
                    css={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 22,
                        width: 2,
                        background: theme.textColor,
                        pointerEvents: "none",
                        "&::before": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: -2,
                            width: 6,
                            height: 6,
                            borderRadius: "0 0 2px 2px",
                            background: theme.textColor
                        }
                    }}
                />
            </div>
            <audio
                ref={media}
                src={src}
                preload="metadata"
                aria-label={`${label} audio`}
                style={{ display: "none" }}
                onPlay={() => setPlaying(true)}
                onPause={() => {
                    setPlaying(false);
                    sync();
                }}
                onEnded={() => {
                    setPlaying(false);
                    sync();
                }}
                onTimeUpdate={sync}
                onLoadedMetadata={sync}
                onError={() => setError("Could not play this audio.")}
            />
            {error && (
                <p role="alert" css={{ color: theme.errorText, padding: 8 }}>
                    {error}
                </p>
            )}
        </div>
    );
}
