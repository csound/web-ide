import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTheme } from "@emotion/react";
import type { AudioData, Plot } from "./types";
import { durationOf, waveformPeaks } from "./audio";
import { spectralPalette } from "../spectral-analyzer/renderer";

/** Redraw a canvas at device resolution when its size or drawing callback changes. */
function useCanvas(
    draw: (
        context: CanvasRenderingContext2D,
        width: number,
        height: number
    ) => void
) {
    const ref = useRef<HTMLCanvasElement>(null);
    const paint = useCallback(() => {
        const canvas = ref.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;
        const { width, height } = canvas.getBoundingClientRect();
        if (!width || !height) return;
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        draw(context, width, height);
    }, [draw]);
    useEffect(() => {
        const observer = new ResizeObserver(paint);
        if (ref.current) observer.observe(ref.current);
        paint();
        return () => observer.disconnect();
    }, [paint]);
    return { ref, paint };
}

/** Draw channel peaks and let pointer drags select a time range; numeric fields provide keyboard input. */
export function Waveform({
    audio,
    range,
    onSelect,
    onSeek,
    disabled = false,
    gain = 0,
    preparedPeaks
}: {
    audio: AudioData;
    range?: [number, number];
    onSelect?: (value: [number, number]) => void;
    onSeek?: (seconds: number) => void;
    disabled?: boolean;
    gain?: number;
    preparedPeaks?: [number, number][];
}) {
    const theme = useTheme();
    const peaks = useMemo(
        () => preparedPeaks ?? waveformPeaks(audio),
        [audio, preparedPeaks]
    );
    const duration = durationOf(audio);
    const drag = useRef<{ start: number; end: number; x: number }>();
    const draw = useCallback(
        (context: CanvasRenderingContext2D, width: number, height: number) => {
            context.fillStyle = theme.headerBackground;
            context.fillRect(0, 0, width, height);
            const selection =
                drag.current && onSelect && !disabled
                    ? [
                          Math.min(drag.current.start, drag.current.end),
                          Math.max(drag.current.start, drag.current.end)
                      ]
                    : range;
            if (selection) {
                context.fillStyle = theme.tabHighlightActive;
                context.globalAlpha = 0.14;
                context.fillRect(
                    (selection[0] / duration) * width,
                    0,
                    ((selection[1] - selection[0]) / duration) * width,
                    height - 22
                );
                context.globalAlpha = 1;
            }
            const mid = (height - 22) / 2,
                scale = mid * 0.86;
            context.strokeStyle = theme.line;
            context.beginPath();
            context.moveTo(0, mid);
            context.lineTo(width, mid);
            context.stroke();
            context.strokeStyle = theme.tabHighlightActive;
            context.lineWidth = Math.max(1, (width / peaks.length) * 0.7);
            const factor = 10 ** (gain / 20);
            context.beginPath();
            peaks.forEach(([min, max], index) => {
                const x = (index / peaks.length) * width;
                context.moveTo(x, mid - Math.min(1, max * factor) * scale);
                context.lineTo(x, mid - Math.max(-1, min * factor) * scale);
            });
            context.stroke();
            if (selection) {
                context.lineWidth = 1;
                context.beginPath();
                for (const value of selection) {
                    const x = Math.max(
                        1,
                        Math.min(width - 1, (value / duration) * width)
                    );
                    context.moveTo(x, 0);
                    context.lineTo(x, height - 22);
                }
                context.stroke();
            }
            context.fillStyle = theme.textColor;
            context.font = `11px ${theme.font.monospace}`;
            for (let tick = 0; tick <= 4; tick++) {
                context.textAlign =
                    tick === 0 ? "left" : tick === 4 ? "right" : "center";
                context.fillText(
                    `${((duration * tick) / 4).toFixed(2)} s`,
                    Math.max(4, Math.min(width - 4, (width * tick) / 4)),
                    height - 5
                );
            }
        },
        [theme, range, duration, peaks, gain, onSelect, disabled]
    );
    const { ref, paint } = useCanvas(draw);
    const timeAt = (event: React.PointerEvent) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        return Math.max(
            0,
            Math.min(
                duration,
                ((event.clientX - bounds.left) / bounds.width) * duration
            )
        );
    };
    return (
        <canvas
            ref={ref}
            role="img"
            aria-label={
                onSelect
                    ? "Audio waveform. Drag to select a range, or use the start and end controls below."
                    : "Audio waveform"
            }
            onPointerDown={(event) => {
                if (!onSeek && (!onSelect || disabled)) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                drag.current = {
                    start: timeAt(event),
                    end: timeAt(event),
                    x: event.clientX
                };
                paint();
            }}
            onPointerMove={(event) => {
                if (drag.current) {
                    drag.current.end = timeAt(event);
                    paint();
                }
            }}
            onPointerUp={(event) => {
                if (!drag.current) return;
                const start = Math.min(drag.current.start, timeAt(event));
                const end = Math.max(drag.current.start, timeAt(event));
                const selecting =
                    onSelect &&
                    !disabled &&
                    Math.abs(event.clientX - drag.current.x) >= 4;
                drag.current = undefined;
                if (selecting && end - start >= 1 / audio.sampleRate)
                    onSelect?.([start, end]);
                else onSeek?.(timeAt(event));
                paint();
            }}
            onPointerCancel={() => {
                drag.current = undefined;
                paint();
            }}
            css={{
                display: "block",
                width: "100%",
                height: 156,
                borderRadius: 4,
                touchAction: onSelect && !disabled ? "none" : "auto",
                cursor:
                    onSelect && !disabled
                        ? "crosshair"
                        : onSeek
                          ? "pointer"
                          : "default"
            }}
        />
    );
}

/** Draw labelled Csound analysis curves or spectral energy using the current theme. */
export function AnalysisGraph({ plot }: { plot: Plot }) {
    const theme = useTheme();
    const draw = useCallback(
        (context: CanvasRenderingContext2D, width: number, height: number) => {
            const left = 48,
                bottom = height - 25,
                top = 12,
                right = width - 12;
            const w = Math.max(1, right - left),
                h = Math.max(1, bottom - top);
            context.fillStyle = theme.headerBackground;
            context.fillRect(0, 0, width, height);
            if (plot.kind === "heatmap") {
                const palette = spectralPalette(theme).bytes;
                const canvas = document.createElement("canvas");
                canvas.width = plot.width;
                canvas.height = plot.height;
                const image = new ImageData(plot.width, plot.height);
                for (let y = 0; y < plot.height; y++)
                    for (let x = 0; x < plot.width; x++) {
                        const value = Math.round(
                            plot.values[
                                (plot.height - y - 1) * plot.width + x
                            ] * 255
                        );
                        image.data.set(
                            palette.subarray(value * 4, value * 4 + 4),
                            (y * plot.width + x) * 4
                        );
                    }
                canvas.getContext("2d")?.putImageData(image, 0, 0);
                context.drawImage(canvas, left, top, w, h);
            } else {
                context.strokeStyle = theme.tabHighlightActive;
                context.lineWidth = 1.5;
                for (const series of plot.series) {
                    context.beginPath();
                    let started = false;
                    for (const [time, value] of series) {
                        if (!Number.isFinite(value)) {
                            started = false;
                            continue;
                        }
                        const x = left + (time / plot.duration) * w,
                            y =
                                bottom -
                                Math.max(0, Math.min(1, value / plot.max)) * h;
                        if (started) context.lineTo(x, y);
                        else context.moveTo(x, y);
                        started = true;
                    }
                    context.stroke();
                }
            }
            context.strokeStyle = theme.line;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(left, top);
            context.lineTo(left, bottom);
            context.lineTo(right, bottom);
            context.stroke();
            context.fillStyle = theme.textColor;
            context.font = `10px ${theme.font.monospace}`;
            context.textAlign = "right";
            for (let index = 0; index <= 4; index++) {
                const value = (plot.max * index) / 4;
                context.fillText(
                    value >= 1000
                        ? `${(value / 1000).toFixed(1)}k`
                        : value < 1
                          ? value.toFixed(2)
                          : value.toFixed(0),
                    left - 6,
                    bottom - (h * index) / 4 + 4
                );
            }
            for (let index = 0; index <= 4; index++) {
                context.textAlign =
                    index === 0 ? "left" : index === 4 ? "right" : "center";
                const value = (plot.duration * index) / 4;
                context.fillText(
                    `${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(2)} ${plot.kind === "lines" ? plot.xUnit || "s" : "s"}`,
                    left + (w * index) / 4,
                    height - 5
                );
            }
        },
        [plot, theme]
    );
    const { ref } = useCanvas(draw);
    return (
        <figure css={{ margin: 0 }}>
            <figcaption
                css={{ fontSize: 12, marginBottom: 8, color: theme.textColor }}
            >
                {plot.label}{" "}
                <span css={{ color: theme.altTextColor }}>({plot.unit})</span>
            </figcaption>
            <canvas
                ref={ref}
                role="img"
                aria-label={`${plot.label}, from 0 to ${plot.max.toFixed(2)} ${plot.unit}`}
                css={{
                    display: "block",
                    width: "100%",
                    height: 220,
                    borderRadius: 4
                }}
            />
            {plot.kind === "heatmap" && (
                <div
                    css={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                        marginTop: 6,
                        color: theme.altTextColor,
                        fontSize: 10
                    }}
                >
                    <span>-100 dB</span>
                    <span
                        aria-hidden="true"
                        css={{
                            width: 100,
                            background: spectralPalette(theme).css
                        }}
                    />
                    <span>0 dB</span>
                </div>
            )}
        </figure>
    );
}
