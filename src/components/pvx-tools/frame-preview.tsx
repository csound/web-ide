import { useMemo, useState } from "react";
import { useTheme } from "@emotion/react";
import Button from "@mui/material/Button";
import { AudioSelect } from "../audio-tools/audio-select";
import { AnalysisGraph } from "../audio-tools/visuals";
import { dimensions, spectrum, type PvxData } from "./format";

/** Frame navigation redraws only the preview, leaving the large text editor alone. */
export function FramePreview({
    analysis,
    onRevealRow
}: {
    analysis: PvxData;
    onRevealRow: (row: number) => void;
}) {
    const theme = useTheme();
    const [frame, setFrame] = useState(0),
        [channel, setChannel] = useState(0);
    const info = dimensions(analysis);
    const selected = Math.min(frame, info.frames - 1),
        selectedChannel = Math.min(channel, info.channels - 1);
    const plot = useMemo(
        () => spectrum(analysis, selected, selectedChannel),
        [analysis, selected, selectedChannel]
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
                    Channel
                    <AudioSelect
                        aria-label="Channel"
                        value={selectedChannel}
                        onChange={(event) =>
                            setChannel(Number(event.target.value))
                        }
                    >
                        {Array.from({ length: info.channels }, (_, index) => (
                            <option value={index} key={index}>
                                Channel {index + 1}
                            </option>
                        ))}
                    </AudioSelect>
                </label>
            </div>
            <input
                aria-label="Frame timeline"
                aria-valuetext={`Frame ${selected + 1} of ${info.frames}, ${((selected * info.hop) / info.sampleRate).toFixed(4)} seconds`}
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
                    {((selected * info.hop) / info.sampleRate).toFixed(4)} s.
                    Text row {5 + selected * info.channels + selectedChannel}.
                </p>
                <Button
                    onClick={() =>
                        onRevealRow(
                            5 + selected * info.channels + selectedChannel
                        )
                    }
                >
                    Show text row
                </Button>
            </div>
            <AnalysisGraph plot={plot} />
            <dl
                css={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "8px 16px",
                    margin: 0,
                    "& dt": { color: theme.altTextColor },
                    "& dd": { margin: 0, fontFamily: theme.font.monospace }
                }}
            >
                <dt>Format</dt>
                <dd>
                    {
                        [
                            "Amplitude / frequency",
                            "Amplitude / phase",
                            "Complex"
                        ][analysis.pv[1]]
                    }
                </dd>
                <dt>FFT size</dt>
                <dd>{(info.bins - 1) * 2}</dd>
                <dt>Sample rate</dt>
                <dd>{info.sampleRate} Hz</dd>
                <dt>Frame hop</dt>
                <dd>{info.hop} samples</dd>
                <dt>Last frame</dt>
                <dd>{info.duration.toFixed(4)} s</dd>
            </dl>
            <p role="status" css={{ color: theme.altTextColor }}>
                Preview matches the current text.
            </p>
        </>
    );
}
