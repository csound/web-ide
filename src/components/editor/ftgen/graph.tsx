import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTheme } from "@emotion/react";
import { plotIndices, type PlotGuide } from "./annotations";
const format = (n: number) =>
    Number(n.toPrecision(5)).toLocaleString("en-US", {
        maximumFractionDigits: 6
    });

export function TableGraph({
    samples,
    guide,
    resizeHandle
}: {
    samples: Float64Array;
    guide: PlotGuide;
    resizeHandle?: ReactNode;
}) {
    const theme = useTheme();
    const container = useRef<HTMLDivElement>(null);
    const cursor = useRef<SVGGElement>(null);
    const readout = useRef<HTMLOutputElement>(null);
    const selected = useRef(0);
    const [size, setSize] = useState({ width: 640, height: 270 });
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) =>
            setSize({
                width: Math.max(240, entry.contentRect.width),
                height: Math.max(160, entry.contentRect.height)
            })
        );
        if (container.current) observer.observe(container.current);
        return () => observer.disconnect();
    }, []);
    const data = useMemo(() => {
        let min = Infinity,
            max = -Infinity,
            sum = 0;
        for (const value of samples.subarray(0, -1)) {
            min = Math.min(min, value);
            max = Math.max(max, value);
            sum += value;
        }
        const lower = Math.min(0, min, samples.at(-1)!),
            upper = Math.max(0, max, samples.at(-1)!),
            span = upper - lower || 1;
        const bottom = lower - span * 0.08,
            top = upper + span * 0.08;
        const left = 56,
            right = size.width - 20,
            height = size.height - 38;
        const x = (i: number) =>
            left + (i / (samples.length - 1)) * (right - left);
        const y = (value: number) =>
            14 + ((top - value) / (top - bottom)) * (height - 14);
        return {
            min,
            max,
            lower,
            upper,
            mean: sum / (samples.length - 1),
            left,
            right,
            height,
            x,
            y,
            path: plotIndices(samples, right - left)
                .map(
                    (i, j) =>
                        `${j ? "L" : "M"}${x(i).toFixed(2)},${y(samples[i]).toFixed(2)}`
                )
                .join(" ")
        };
    }, [samples, size]);
    const inspect = (index: number) => {
        const i = Math.max(0, Math.min(samples.length - 1, Math.round(index)));
        selected.current = i;
        cursor.current?.setAttribute("transform", `translate(${data.x(i)},0)`);
        cursor.current?.setAttribute("visibility", "visible");
        if (readout.current)
            readout.current.value = `${i === samples.length - 1 ? "Guard point" : `Sample ${i}`}   ${format(samples[i])}`;
    };
    return (
        <div
            css={{
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                flex: 1
            }}
        >
            <div ref={container} css={{ flex: 1, minHeight: 160 }}>
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${size.width} ${size.height}`}
                    role="img"
                    aria-label={`${guide.detail}. Minimum ${format(data.min)}, maximum ${format(data.max)}. Use arrow keys to inspect samples.`}
                    tabIndex={0}
                    onPointerMove={(event) => {
                        const box = event.currentTarget.getBoundingClientRect();
                        inspect(
                            ((((event.clientX - box.left) / box.width) *
                                size.width -
                                data.left) /
                                (data.right - data.left)) *
                                (samples.length - 1)
                        );
                    }}
                    onFocus={() => inspect(selected.current)}
                    onKeyDown={(event) => {
                        if (
                            ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                                event.key
                            )
                        ) {
                            event.preventDefault();
                            inspect(
                                event.key === "Home"
                                    ? 0
                                    : event.key === "End"
                                      ? samples.length - 1
                                      : selected.current +
                                        (event.key === "ArrowLeft" ? -1 : 1) *
                                            (event.shiftKey ? 100 : 1)
                            );
                        }
                    }}
                    css={{
                        display: "block",
                        outline: "none",
                        "&:focus-visible": {
                            outline: `1px solid ${theme.altTextColor}`,
                            outlineOffset: -3
                        },
                        fontFamily: theme.font.monospace,
                        fontSize: 10,
                        overflow: "visible"
                    }}
                >
                    {[data.lower, 0, data.upper]
                        .filter((n, i, all) => all.indexOf(n) === i)
                        .map((value) => (
                            <g key={value}>
                                <line
                                    x1={data.left}
                                    x2={data.right}
                                    y1={data.y(value)}
                                    y2={data.y(value)}
                                    stroke={theme.line}
                                    strokeDasharray={value ? "2 5" : undefined}
                                />
                                <text
                                    x={data.left - 10}
                                    y={data.y(value) + 3}
                                    fill={theme.altTextColor}
                                    textAnchor="end"
                                >
                                    {format(value)}
                                </text>
                            </g>
                        ))}
                    {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
                        <g key={fraction}>
                            <line
                                x1={data.x(fraction * (samples.length - 1))}
                                x2={data.x(fraction * (samples.length - 1))}
                                y1={14}
                                y2={data.height}
                                stroke={theme.line}
                                strokeDasharray="2 5"
                            />
                            <text
                                x={data.x(fraction * (samples.length - 1))}
                                y={size.height - 18}
                                textAnchor="middle"
                                fill={theme.altTextColor}
                            >
                                {guide.domain
                                    ? format(
                                          guide.domain[0] +
                                              fraction *
                                                  (guide.domain[1] -
                                                      guide.domain[0])
                                      )
                                    : Math.round(
                                          fraction * (samples.length - 1)
                                      ).toLocaleString()}
                            </text>
                        </g>
                    ))}
                    <path
                        d={`${data.path} L${data.right},${data.y(0)} L${data.left},${data.y(0)} Z`}
                        fill={theme.iRateVar}
                        opacity=".08"
                    />
                    <path
                        d={data.path}
                        fill="none"
                        stroke={theme.iRateVar}
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                    />
                    {guide.points.slice(0, 128).map((point, i) => (
                        <circle
                            key={i}
                            cx={data.x(point)}
                            cy={data.y(samples[Math.round(point)])}
                            r="3"
                            fill={theme.background}
                            stroke={theme.iRateVar}
                        >
                            <title>Breakpoint at sample {format(point)}</title>
                        </circle>
                    ))}
                    <g ref={cursor} visibility="hidden" pointerEvents="none">
                        <line
                            y1="10"
                            y2={data.height}
                            stroke={theme.textColor}
                            opacity=".6"
                            strokeDasharray="3 3"
                        />
                    </g>
                </svg>
            </div>
            <div
                css={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px 16px",
                    justifyContent: "space-between",
                    color: theme.altTextColor,
                    font: `11px ${theme.font.monospace}`,
                    padding: "0 20px 10px 56px"
                }}
            >
                <span>{guide.label}</span>
                <output ref={readout}>Point to the curve to inspect</output>
            </div>
            {!!guide.harmonics.length && (
                <div
                    css={{
                        margin: "0 20px 14px 56px",
                        display: "flex",
                        alignItems: "end",
                        gap: 4,
                        height: 44
                    }}
                    aria-label="Input partial amplitudes"
                >
                    <span
                        css={{
                            fontSize: 10,
                            color: theme.altTextColor,
                            alignSelf: "center",
                            marginRight: 8
                        }}
                    >
                        Partials
                    </span>
                    {guide.harmonics
                        .slice(0, 48)
                        .map(({ partial, amplitude }, i) => (
                            <div
                                key={i}
                                title={`Partial ${partial}: ${amplitude} (input amplitude)`}
                                css={{
                                    height: "100%",
                                    flex: 1,
                                    maxWidth: 28,
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "end",
                                    alignItems: "center",
                                    gap: 3
                                }}
                            >
                                <div
                                    css={{
                                        width: "65%",
                                        minHeight: 1,
                                        height: `${(Math.abs(amplitude) / Math.max(...guide.harmonics.map((h) => Math.abs(h.amplitude)), 0.001)) * 27}px`,
                                        background: theme.iRateVar,
                                        opacity: 0.6
                                    }}
                                />
                                <span
                                    css={{
                                        font: `9px ${theme.font.monospace}`,
                                        color: theme.altTextColor
                                    }}
                                >
                                    {partial}
                                </span>
                            </div>
                        ))}
                </div>
            )}
            <div
                css={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexShrink: 0,
                    borderTop: `1px solid ${theme.line}`,
                    padding: "8px 12px 8px 20px",
                    font: `11px ${theme.font.monospace}`,
                    color: theme.altTextColor
                }}
            >
                <div
                    css={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "8px 24px",
                        flex: 1,
                        minWidth: 0
                    }}
                >
                    <span>
                        MIN{" "}
                        <b css={{ color: theme.textColor }}>
                            {format(data.min)}
                        </b>
                    </span>
                    <span>
                        MAX{" "}
                        <b css={{ color: theme.textColor }}>
                            {format(data.max)}
                        </b>
                    </span>
                    <span>
                        MEAN{" "}
                        <b css={{ color: theme.textColor }}>
                            {format(data.mean)}
                        </b>
                    </span>
                    <span title="The endpoint sample used for interpolation, shown at the right edge">
                        GUARD{" "}
                        <b css={{ color: theme.textColor }}>
                            {format(samples.at(-1)!)}
                        </b>
                    </span>
                </div>
                {resizeHandle}
            </div>
        </div>
    );
}
