import { useEffect, useMemo, useRef } from "react";
import { useTheme } from "@emotion/react";
import { durationOf, waveformPeaks } from "./audio";
import { MAX_AUDIO_SAMPLES } from "./limits";
import type { MixTrack } from "./mixer";

/** Draw one clip on the shared time scale; commit a drag only when the pointer is released. */
export function MixTimeline({
    track,
    span,
    audible,
    onMove
}: {
    track: MixTrack;
    span: number;
    audible: boolean;
    onMove: (seconds: number) => void;
}) {
    const theme = useTheme();
    const lane = useRef<HTMLDivElement>(null);
    const clip = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const clock = useRef<HTMLOutputElement>(null);
    const drag = useRef<{
        x: number;
        start: number;
        value: number;
        width: number;
    }>();
    const peaks = useMemo(() => waveformPeaks(track.audio, 500), [track.audio]);
    const duration = durationOf(track.audio);
    const start = Number.isFinite(track.start) ? track.start : 0;
    const maxStart = Math.max(
        0,
        MAX_AUDIO_SAMPLES / (2 * track.audio.sampleRate) - duration
    );
    const bounded = (value: number) =>
        Math.min(maxStart, Math.round(Math.max(0, value) * 100) / 100);
    useEffect(() => {
        const element = canvas.current;
        if (!element) return;
        const draw = () => {
            const context = element.getContext("2d");
            if (!context) return;
            const width = element.clientWidth,
                height = element.clientHeight;
            const ratio = window.devicePixelRatio || 1;
            element.width = Math.round(width * ratio);
            element.height = Math.round(height * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            context.clearRect(0, 0, width, height);
            context.strokeStyle = theme.tabHighlightActive;
            context.lineWidth = Math.max(1, (width / peaks.length) * 0.7);
            const gain =
                10 ** ((Number.isFinite(track.gain) ? track.gain : 0) / 20);
            context.beginPath();
            for (const [index, [min, max]] of peaks.entries()) {
                const x = (index / peaks.length) * width;
                context.moveTo(
                    x,
                    height / 2 - Math.min(1, max * gain) * height * 0.42
                );
                context.lineTo(
                    x,
                    height / 2 - Math.max(-1, min * gain) * height * 0.42
                );
            }
            context.stroke();
        };
        const observer = new ResizeObserver(draw);
        observer.observe(element);
        draw();
        return () => observer.disconnect();
    }, [peaks, theme, track.gain]);
    const paintPosition = (value: number) => {
        if (clip.current) clip.current.style.left = `${(value / span) * 100}%`;
        if (clock.current) clock.current.textContent = `${value.toFixed(2)} s`;
    };
    const endDrag = () => {
        drag.current = undefined;
        // Drag previews are temporary; committed positions must follow the new scale.
        clip.current?.style.removeProperty("left");
        if (clock.current) clock.current.textContent = `${start.toFixed(2)} s`;
    };
    return (
        <div
            ref={lane}
            css={{
                position: "relative",
                height: 80,
                minWidth: 0,
                background: theme.headerBackground,
                borderRadius: 4,
                overflow: "hidden"
            }}
        >
            <div
                ref={clip}
                role="slider"
                tabIndex={0}
                aria-label={`Move ${track.name}`}
                aria-valuemin={0}
                aria-valuemax={maxStart}
                aria-valuenow={start}
                aria-valuetext={`${start.toFixed(2)} seconds`}
                onKeyDown={(event) => {
                    const step = event.shiftKey ? 1 : 0.01;
                    const value = {
                        ArrowLeft: start - step,
                        ArrowRight: start + step,
                        Home: 0
                    }[event.key];
                    if (value !== undefined) {
                        event.preventDefault();
                        onMove(bounded(value));
                    }
                }}
                onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    event.currentTarget.focus();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    drag.current = {
                        x: event.clientX,
                        start,
                        value: start,
                        width: lane.current?.clientWidth || 1
                    };
                }}
                onPointerMove={(event) => {
                    const current = drag.current;
                    if (!current) return;
                    current.value = bounded(
                        current.start +
                            ((event.clientX - current.x) / current.width) * span
                    );
                    paintPosition(current.value);
                }}
                onPointerUp={() => {
                    if (!drag.current) return;
                    const value = drag.current.value;
                    endDrag();
                    onMove(value);
                }}
                onPointerCancel={endDrag}
                onLostPointerCapture={() => {
                    if (drag.current) endDrag();
                }}
                css={{
                    position: "absolute",
                    top: 4,
                    bottom: 4,
                    left: `${(start / span) * 100}%`,
                    width: `${(duration / span) * 100}%`,
                    minWidth: 6,
                    boxSizing: "border-box",
                    border: `1px solid ${theme.tabHighlightActive}`,
                    borderRadius: 4,
                    opacity: audible ? 1 : 0.35,
                    cursor: "grab",
                    touchAction: "none",
                    overflow: "hidden",
                    "&:active": { cursor: "grabbing" }
                }}
            >
                <canvas
                    ref={canvas}
                    aria-hidden
                    css={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none"
                    }}
                />
            </div>
            {/* Keep one text child so React can replace the drag preview on commit. */}
            <output
                ref={clock}
                aria-hidden
                css={{
                    position: "absolute",
                    right: 6,
                    top: 4,
                    pointerEvents: "none",
                    fontSize: 10,
                    color: theme.textColor,
                    background: theme.headerBackground
                }}
            >
                {`${start.toFixed(2)} s`}
            </output>
        </div>
    );
}
