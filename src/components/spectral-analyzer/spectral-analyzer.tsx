import { useEffect, useRef, useState } from "react";
import { useTheme } from "@emotion/react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Button from "@mui/material/Button";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { useSelector } from "@root/store";
import { csoundInstance } from "../csound";
import { observeAudio } from "./audio";
import { BANDS, createBandSampler } from "./analysis";
import {
    createSpectralRenderer,
    spectralPalette,
    type ViewMode
} from "./renderer";

type Display = ReturnType<typeof createSpectralRenderer>;

export default function SpectralAnalyzer() {
    const theme = useTheme();
    const initialTheme = useRef(theme);
    const status = useSelector((state) => state.csound.status);
    const engine =
        status === "playing" || status === "paused"
            ? csoundInstance
            : undefined;
    const [mode, setMode] = useState<ViewMode>("spectrogram");
    const [frozen, setFrozen] = useState(
        () =>
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
            false
    );
    const [analyser, setAnalyser] = useState<AnalyserNode>();
    const [error, setError] = useState(false);
    const [hasAudio, setHasAudio] = useState(false);
    const heatmap = useRef<HTMLDivElement>(null);
    const overlay = useRef<HTMLCanvasElement>(null);
    const display = useRef<Display>();

    useEffect(() => {
        if (!heatmap.current || !overlay.current) return;
        const renderer = createSpectralRenderer(
            heatmap.current,
            overlay.current,
            initialTheme.current
        );
        display.current = renderer;
        const observer = new ResizeObserver(renderer.resize);
        observer.observe(overlay.current);
        renderer.resize();
        return () => {
            observer.disconnect();
            renderer.dispose();
            display.current = undefined;
        };
    }, []);

    useEffect(() => {
        display.current?.configure(mode, theme);
    }, [mode, theme]);

    useEffect(() => {
        setAnalyser(undefined);
        setError(false);
        if (!engine) return;
        setHasAudio(false);
        return observeAudio(
            engine,
            (node) => {
                display.current?.start(node.context.sampleRate);
                setAnalyser(node);
                setHasAudio(true);
            },
            () => setError(true)
        );
    }, [engine]);

    useEffect(() => {
        if (!analyser || frozen || status !== "playing") return;
        const renderer = display.current;
        if (!renderer) return;
        const fft = new Float32Array(analyser.frequencyBinCount);
        const bands = new Uint8Array(BANDS);
        const sample = createBandSampler(analyser.context.sampleRate);
        let frame = 0;
        renderer.history.resetClock();
        const draw = () => {
            if (
                !document.hidden &&
                renderer.history.isDue(analyser.context.currentTime)
            ) {
                analyser.getFloatFrequencyData(fft);
                sample(fft, bands);
                if (
                    renderer.history.append(bands, analyser.context.currentTime)
                )
                    renderer.draw();
            }
            frame = requestAnimationFrame(draw);
        };
        frame = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(frame);
    }, [analyser, frozen, status]);

    const message = error
        ? "Audio analysis is unavailable. Stop and run the project to try again."
        : status === "rendering"
          ? "The analyzer is available during live playback."
          : status === "loading" || (engine && !analyser)
            ? "Waiting for audio…"
            : !hasAudio
              ? "Run a project to see its sound."
              : undefined;
    const stateLabel = error
        ? "Unavailable"
        : frozen
          ? "Frozen"
          : status === "paused"
            ? "Paused"
            : status === "playing"
              ? "Live"
              : hasAudio
                ? "Stopped"
                : "Ready";
    const palette = spectralPalette(theme);
    return (
        <section
            aria-label="Spectral analyzer"
            css={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                width: "100%",
                minHeight: 0,
                minWidth: 0,
                overflow: "hidden",
                background: theme.background,
                color: theme.textColor,
                fontFamily: theme.font.regular
            }}
        >
            <div
                css={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "4px 8px",
                    padding: "6px 8px",
                    borderBottom: `1px solid ${theme.line}`,
                    flexShrink: 0,
                    "& button": {
                        fontFamily: theme.font.regular,
                        fontSize: 11,
                        textTransform: "none",
                        whiteSpace: "nowrap"
                    },
                    "& button:focus-visible": {
                        outline: `2px solid ${theme.textColor}`,
                        outlineOffset: -2
                    },
                    "& button:active": { transform: "scale(0.98)" }
                }}
            >
                <ToggleButtonGroup
                    exclusive
                    value={mode}
                    aria-label="Analyzer view"
                    onChange={(_, next: ViewMode | null) => {
                        if (next) setMode(next);
                    }}
                    css={{
                        "&& button": {
                            border: 0,
                            padding: "4px 8px",
                            minHeight: 28,
                            borderRadius: 4,
                            color: theme.altTextColor,
                            lineHeight: 1.2,
                            "&.Mui-selected": {
                                background: theme.highlightBackground,
                                color: theme.textColor
                            },
                            "&:hover": {
                                background: theme.buttonBackgroundHover
                            },
                            "@media (pointer: coarse)": { minHeight: 36 }
                        }
                    }}
                >
                    <ToggleButton disableRipple value="spectrogram">
                        Spectrogram
                    </ToggleButton>
                    <ToggleButton disableRipple value="spectrum">
                        Spectrum
                    </ToggleButton>
                </ToggleButtonGroup>
                <Button
                    disableRipple
                    aria-pressed={frozen}
                    aria-label={
                        frozen ? "Unfreeze analyzer" : "Freeze analyzer"
                    }
                    title="Freeze the display without pausing audio"
                    onClick={() => setFrozen((value) => !value)}
                    startIcon={
                        frozen ? <PlayArrowRoundedIcon /> : <PauseRoundedIcon />
                    }
                    css={{
                        "&&": {
                            minWidth: 0,
                            padding: "4px 6px",
                            color: theme.textColor,
                            lineHeight: 1.2
                        },
                        "& .MuiButton-startIcon": {
                            marginRight: 3,
                            marginLeft: 0
                        }
                    }}
                >
                    {frozen ? "Unfreeze" : "Freeze"}
                </Button>
                <div
                    aria-label="Level: -100 to 0 decibels"
                    css={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontFamily: theme.font.monospace,
                        fontSize: 10,
                        color: theme.altTextColor
                    }}
                >
                    <span>-100</span>
                    <span
                        aria-hidden="true"
                        css={{
                            width: 56,
                            height: 5,
                            borderRadius: 2,
                            background: palette.css
                        }}
                    />
                    <span>0 dB</span>
                </div>
            </div>
            <div
                css={{
                    position: "relative",
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden"
                }}
            >
                <div
                    ref={heatmap}
                    data-testid="spectrogram-heatmap"
                    css={{
                        position: "absolute",
                        left: 48,
                        right: 12,
                        top: 12,
                        bottom: 24
                    }}
                />
                <canvas
                    ref={overlay}
                    role="img"
                    aria-label={
                        mode === "spectrogram"
                            ? "Spectrogram: logarithmic frequency from 20 Hz to 20 kHz or Nyquist, across 10 seconds of playback. Color shows level from -100 to 0 dB."
                            : "Spectrum: logarithmic frequency from 20 Hz to 20 kHz or Nyquist, with level from -100 to 0 dB."
                    }
                    css={{
                        display: "block",
                        position: "absolute",
                        width: "100%",
                        height: "100%"
                    }}
                />
                {message && (
                    <div
                        role="status"
                        css={{
                            position: "absolute",
                            inset: "12px 12px 24px 48px",
                            display: "grid",
                            placeItems: "center",
                            textAlign: "center",
                            fontSize: 12,
                            padding: 12,
                            background: theme.background + "e8",
                            color: theme.altTextColor
                        }}
                    >
                        {message}
                    </div>
                )}
            </div>
            <div
                css={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0 12px 5px 48px",
                    fontSize: 10,
                    color: theme.altTextColor,
                    flexShrink: 0
                }}
            >
                <span>Log frequency</span>
                <span role="status">{stateLabel}</span>
            </div>
        </section>
    );
}
