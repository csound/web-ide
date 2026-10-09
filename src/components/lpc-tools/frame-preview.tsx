import { useMemo, useState } from "react";
import { useTheme } from "@emotion/react";
import Button from "@mui/material/Button";
import { AudioSelect } from "../audio-tools/audio-select";
import { AnalysisGraph } from "../audio-tools/visuals";
import type { Plot } from "../audio-tools/types";
import { dimensions, type LpcData } from "./format";
const metrics = ["Residual RMS", "Source RMS", "Error", "Pitch"];
/** Frame navigation updates the preview without redrawing the text editor. */
export function FramePreview({
    analysis,
    onRevealRow
}: {
    analysis: LpcData;
    onRevealRow: (row: number) => void;
}) {
    const theme = useTheme();
    const [frame, setFrame] = useState(0),
        [metric, setMetric] = useState(3);
    const info = dimensions(analysis),
        selected = Math.min(frame, info.frames - 1);
    const plot = useMemo<Plot>(() => {
        const points: [number, number][] = [];
        let max = 0;
        // Keep extrema when reducing a long track, including short pitch excursions.
        const step = Math.max(1, Math.ceil(info.frames / 500));
        for (let i = 0; i < info.frames; i += step) {
            let low = i,
                high = i;
            for (let j = i; j < Math.min(info.frames, i + step); j++) {
                const v = analysis.values[j * analysis.width + metric];
                if (v < analysis.values[low * analysis.width + metric]) low = j;
                if (v > analysis.values[high * analysis.width + metric])
                    high = j;
            }
            for (const j of [...new Set([low, high])].sort((a, b) => a - b)) {
                const value = analysis.values[j * analysis.width + metric];
                max = Math.max(max, value);
                points.push([j / analysis.rate, value]);
            }
        }
        return {
            kind: "lines",
            label: metrics[metric] + " over time",
            unit: metric === 3 ? "Hz" : "value",
            duration: info.duration || 1 / analysis.rate,
            max: max || 1,
            series: [points]
        };
    }, [analysis, metric, info.duration, info.frames]);
    const selectedValues = analysis.values.subarray(
        selected * analysis.width,
        (selected + 1) * analysis.width
    );
    return (
        <>
            <div
                css={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12
                }}
            >
                <label>
                    Frame
                    <input
                        aria-label="Frame number"
                        type="number"
                        min={1}
                        max={info.frames}
                        value={selected + 1}
                        onChange={(event) =>
                            setFrame(
                                Math.max(
                                    0,
                                    Math.min(
                                        info.frames - 1,
                                        Math.floor(
                                            Number(event.target.value) || 1
                                        ) - 1
                                    )
                                )
                            )
                        }
                    />
                </label>
                <label>
                    Timeline
                    <AudioSelect
                        aria-label="Timeline metric"
                        value={metric}
                        onChange={(event) =>
                            setMetric(Number(event.target.value))
                        }
                    >
                        {metrics.map((name, index) => (
                            <option value={index} key={name}>
                                {name}
                            </option>
                        ))}
                    </AudioSelect>
                </label>
            </div>
            <input
                aria-label="Frame timeline"
                aria-valuetext={`Frame ${selected + 1} of ${info.frames}, ${(selected / analysis.rate).toFixed(4)} seconds`}
                type="range"
                min={0}
                max={info.frames - 1}
                step={1}
                value={selected}
                disabled={info.frames === 1}
                onChange={(event) => setFrame(Number(event.target.value))}
                css={{
                    width: "100%",
                    margin: 0,
                    accentColor: theme.tabHighlightActive
                }}
            />
            <div
                css={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap"
                }}
            >
                <p css={{ color: theme.altTextColor, flex: 1 }}>
                    Frame {selected + 1} of {info.frames} at{" "}
                    {(selected / analysis.rate).toFixed(4)} s. Text row{" "}
                    {6 + selected}.
                </p>
                <Button onClick={() => onRevealRow(6 + selected)}>
                    Show text row
                </Button>
            </div>
            <AnalysisGraph plot={plot} cursor={selected / analysis.rate} />
            <dl
                css={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr auto",
                    gap: "8px 12px",
                    margin: 0,
                    "& dt": { color: theme.altTextColor },
                    "& dd": { margin: 0, fontFamily: theme.font.monospace },
                    "@container (max-width: 760px)": {
                        gridTemplateColumns: "1fr auto"
                    }
                }}
            >
                {metrics.map((label, index) => (
                    <div key={label} css={{ display: "contents" }}>
                        <dt>{label}</dt>
                        <dd>
                            {Number(selectedValues[index].toPrecision(5))}
                            {index === 3 ? " Hz" : ""}
                        </dd>
                    </div>
                ))}
            </dl>
            <FilterValues
                values={selectedValues.subarray(4)}
                poles={analysis.magic === 2399}
            />
            <p css={{ color: theme.altTextColor }}>
                {analysis.poles}{" "}
                {analysis.magic === 2399
                    ? "poles (magnitude / phase)"
                    : "filter coefficients"}
                , {analysis.sampleRate} Hz,{" "}
                {Number(analysis.rate.toPrecision(6))} frames/s.
            </p>
            <p role="status" css={{ color: theme.altTextColor }}>
                Preview matches the current text.
            </p>
        </>
    );
}
function FilterValues({
    values,
    poles
}: {
    values: Float64Array;
    poles: boolean;
}) {
    const theme = useTheme();
    // Signed values stay signed. Pole files show magnitude only; phase stays in text.
    const count = poles ? values.length / 2 : values.length;
    const at = (i: number) => values[i * (poles ? 2 : 1)];
    let scale = 0;
    for (let i = 0; i < count; i++) scale = Math.max(scale, Math.abs(at(i)));
    const step = Math.max(1, Math.ceil(count / 200));
    const bars: string[] = [];
    for (let i = 0; i < count; i += step) {
        let low = 0,
            high = 0;
        for (let j = i; j < Math.min(count, i + step); j++) {
            low = Math.min(low, at(j));
            high = Math.max(high, at(j));
        }
        const x = 8 + (i / Math.max(1, count - 1)) * 464;
        bars.push(
            `M${x},${56 - (low / (scale || 1)) * 44}V${56 - (high / (scale || 1)) * 44}`
        );
    }
    const title = poles ? "Pole magnitudes" : "Filter coefficients";
    return (
        <figure css={{ margin: 0 }}>
            <figcaption css={{ marginBottom: 6 }}>
                {title}{" "}
                <span css={{ color: theme.altTextColor }}>(frame values)</span>
            </figcaption>
            <svg
                viewBox="0 0 480 112"
                role="img"
                aria-label={`${title}, signed scale from ${-scale} to ${scale}`}
                css={{
                    display: "block",
                    width: "100%",
                    height: 112,
                    borderRadius: 4,
                    background: theme.headerBackground
                }}
            >
                <line x1="8" x2="472" y1="56" y2="56" stroke={theme.line} />
                <path
                    d={bars.join(" ")}
                    stroke={theme.tabHighlightActive}
                    strokeWidth={Math.max(1, Math.min(6, 400 / count))}
                />
            </svg>
            <p css={{ fontSize: 11, color: theme.altTextColor }}>
                Index 1 to {count}. Scale ±{Number(scale.toPrecision(5))}.
            </p>
        </figure>
    );
}
