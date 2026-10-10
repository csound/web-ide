import { blobFromBytes } from "@root/utils/blob";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@emotion/react";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import {
    StreamLanguage,
    syntaxHighlighting,
    HighlightStyle
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { CodePane } from "../score-tools/code-pane";
import { AudioSelect } from "../audio-tools/audio-select";
import { AnalysisGraph } from "../audio-tools/visuals";
import type { AudioSource } from "../audio-tools/audio-tool";
import type { ToolFile } from "../audio-tools/types";
import { useDebouncedTask } from "../audio-tools/use-debounced-task";
import {
    checkHetroSize,
    convertHetro,
    exampleText,
    MAX_HETRO_BYTES,
    openHetro,
    partialPlots
} from "./convert";

const language = [
    StreamLanguage.define({
        token(stream) {
            if (stream.match("HETRO")) return "keyword";
            if (stream.match(/-?\d+/)) return "number";
            stream.next();
            return null;
        }
    }),
    syntaxHighlighting(
        HighlightStyle.define([
            { tag: tags.keyword, class: "cm-csound-define" },
            { tag: tags.number, class: "cm-csound-number" }
        ])
    )
];

/** One editor for both HETRO conversion directions, with plots of the current valid edits. */
export default function HetroTool({
    sources = [],
    onSave
}: {
    sources?: AudioSource[];
    onSave: (file: ToolFile) => string;
}) {
    const theme = useTheme();
    const [text, setText] = useState("");
    const [baseline, setBaseline] = useState("");
    const [name, setName] = useState("analysis.het");
    const [loading, setLoading] = useState("");
    const [error, setError] = useState("");
    const [partial, setPartial] = useState(0);
    const [copied, setCopied] = useState<string>();
    const [saved, setSaved] = useState<{ data: Uint8Array; name: string }>();
    const job = useRef<AbortController>();
    const input = useRef<HTMLInputElement>(null);
    useEffect(() => () => job.current?.abort(), []);
    const edit = useCallback((next: string) => {
        setText(next);
        setError("");
    }, []);
    const request = useMemo(
        () => (text.trim() && !loading ? { text, name } : undefined),
        [text, name, loading]
    );
    const preview = useDebouncedTask(request, convertHetro);
    const result = preview.value;
    const selected = Math.min(partial, (result?.analysis.partials || 1) - 1);
    const plots = useMemo(
        () => (result ? partialPlots(result.analysis, selected) : undefined),
        [result, selected]
    );
    const busy = Boolean(loading || preview.pending);
    const problem = error || preview.error;
    const load = async (source: AudioSource) => {
        job.current?.abort();
        const controller = new AbortController();
        job.current = controller;
        setLoading(`Reading ${source.name}…`);
        setError("");
        try {
            const data = await source.load(controller.signal);
            controller.signal.throwIfAborted();
            const loaded = await openHetro(
                { name: source.name, data },
                controller.signal,
                (message) => {
                    if (!controller.signal.aborted) setLoading(message);
                }
            );
            controller.signal.throwIfAborted();
            setText(loaded);
            setBaseline(loaded);
            setName(source.name);
            setPartial(0);
            setSaved(undefined);
            setCopied(undefined);
        } catch (cause) {
            if (!controller.signal.aborted)
                setError(
                    cause instanceof Error
                        ? cause.message
                        : "Could not open this analysis."
                );
        } finally {
            if (!controller.signal.aborted) setLoading("");
        }
    };
    const download = (file: ToolFile) => {
        const url = URL.createObjectURL(blobFromBytes(file.data));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = file.name;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    const copy = async () => {
        if (!result) return;
        const current = result.text;
        try {
            await navigator.clipboard.writeText(current);
            setCopied(current);
            setError("");
        } catch {
            setError(
                "Could not copy. Select the text and use your keyboard to copy it."
            );
        }
    };
    return (
        <section
            aria-label="HETRO editor"
            aria-busy={busy}
            css={{
                height: "100%",
                overflow: "auto",
                containerType: "inline-size",
                color: theme.textColor,
                background: theme.background,
                fontFamily: theme.font.regular,
                fontSize: 12,
                "& button": {
                    fontFamily: "inherit",
                    fontSize: 12,
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    borderRadius: 4
                },
                "& .MuiButton-root": {
                    color: theme.textColor,
                    borderColor: theme.line,
                    minHeight: 32
                },
                "& .Mui-disabled": { color: theme.disabledTextColor },
                "& button:hover": { background: theme.buttonBackgroundHover },
                "& button:active": { transform: "scale(0.98)" },
                "& button:focus-visible, & select:focus-visible, & summary:focus-visible":
                    {
                        outline: `2px solid ${theme.textColor}`,
                        outlineOffset: 2
                    },
                "& label": { display: "grid", gap: 6 },
                "& select": {
                    width: "100%",
                    minWidth: 0,
                    padding: "7px 8px",
                    background: theme.textFieldBackground,
                    color: theme.textColor,
                    border: `1px solid ${theme.line}`,
                    borderRadius: 4,
                    font: "inherit"
                },
                "& p": { margin: 0, lineHeight: 1.5 },
                "& .hetro-panes": {
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                    gap: 16
                },
                "@container (max-width: 620px)": {
                    "& .hetro-panes": { gridTemplateColumns: "minmax(0, 1fr)" }
                },
                "@media (prefers-reduced-motion: reduce)": {
                    "& button": { transition: "none" },
                    "& button:active": { transform: "none" },
                    "& .MuiLinearProgress-bar": { animation: "none" }
                }
            }}
        >
            <div css={{ position: "sticky", top: 0, height: 4, zIndex: 2 }}>
                {busy && (
                    <LinearProgress
                        aria-label={loading || preview.status}
                        css={{
                            background: theme.line,
                            "& .MuiLinearProgress-bar": {
                                background: theme.tabHighlightActive
                            }
                        }}
                    />
                )}
            </div>
            <div css={{ padding: 16, display: "grid", gap: 16 }}>
                <header
                    css={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        alignItems: "end"
                    }}
                >
                    <div css={{ marginRight: "auto", alignSelf: "center" }}>
                        <strong css={{ fontSize: 14 }}>HETRO editor</strong>
                        <p css={{ color: theme.altTextColor }}>
                            Edit harmonic analysis for adsyn.
                        </p>
                    </div>
                    <label css={{ flex: "1 1 180px", maxWidth: 300 }}>
                        Project analysis
                        <AudioSelect
                            aria-label="Project analysis file"
                            value=""
                            disabled={Boolean(loading)}
                            onChange={(event) => {
                                const source = sources.find(
                                    (item) => item.id === event.target.value
                                );
                                if (source) void load(source);
                            }}
                        >
                            <option value="">Open a project file…</option>
                            {sources.map((source) => (
                                <option key={source.id} value={source.id}>
                                    {source.name}
                                </option>
                            ))}
                        </AudioSelect>
                    </label>
                    <Button
                        variant="outlined"
                        startIcon={<UploadFileRounded />}
                        onClick={() => input.current?.click()}
                        disabled={Boolean(loading)}
                    >
                        Open file
                    </Button>
                    <input
                        ref={input}
                        type="file"
                        aria-label="Open HETRO or text file"
                        accept=".het,.txt,.csv"
                        hidden
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file)
                                void load({
                                    id: file.name,
                                    name: file.name,
                                    load: async (signal) => {
                                        checkHetroSize(file.size);
                                        const bytes = new Uint8Array(
                                            await file.arrayBuffer()
                                        );
                                        signal.throwIfAborted();
                                        return bytes;
                                    }
                                });
                        }}
                    />
                </header>
                {loading && (
                    <div
                        css={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                        <p role="status" css={{ flex: 1 }}>
                            {loading}
                        </p>
                        <Button
                            onClick={() => {
                                job.current?.abort();
                                setLoading("");
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                )}
                {problem && (
                    <div
                        role="alert"
                        css={{
                            padding: 12,
                            borderLeft: `3px solid ${theme.errorText}`,
                            overflowWrap: "anywhere"
                        }}
                    >
                        <p>{problem}</p>
                        {preview.error && (
                            <Button onClick={preview.retry}>Retry</Button>
                        )}
                    </div>
                )}
                <div className="hetro-panes">
                    <div
                        css={{
                            minWidth: 0,
                            display: "grid",
                            gap: 10,
                            alignContent: "start"
                        }}
                    >
                        <div
                            css={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap"
                            }}
                        >
                            <strong css={{ flex: 1 }}>Editable text</strong>
                            <Button
                                disabled={Boolean(loading) || text === baseline}
                                onClick={() => {
                                    setText(baseline);
                                    setError("");
                                }}
                            >
                                Reset edits
                            </Button>
                            <Button
                                startIcon={<ContentCopyRounded />}
                                disabled={!result || busy}
                                onClick={() => void copy()}
                            >
                                {result && copied === result.text
                                    ? "Copied"
                                    : "Copy text"}
                            </Button>
                        </div>
                        <div
                            css={{
                                height: 400,
                                minWidth: 0,
                                overflow: "hidden",
                                border: `1px solid ${theme.line}`,
                                borderRadius: 4
                            }}
                        >
                            <CodePane
                                label="HETRO text"
                                value={text}
                                onChange={loading ? undefined : edit}
                                language={language}
                                hint="Open an analysis, paste HETRO text, or try the example."
                            />
                        </div>
                        {!text && (
                            <Button
                                variant="outlined"
                                disabled={Boolean(loading)}
                                onClick={() => {
                                    setText(exampleText);
                                    setBaseline(exampleText);
                                    setName("example.het");
                                    setError("");
                                }}
                            >
                                Try example
                            </Button>
                        )}
                        <details>
                            <summary
                                css={{ cursor: "pointer", padding: "6px 0" }}
                            >
                                How to read this text
                            </summary>
                            <div
                                css={{
                                    display: "grid",
                                    gap: 8,
                                    color: theme.altTextColor,
                                    paddingTop: 8
                                }}
                            >
                                <p>
                                    HETRO starts with the partial count. Each
                                    partial has an amplitude row (-1), then a
                                    frequency row (-2).
                                </p>
                                <p>
                                    Each row contains time/value pairs. Times
                                    use whole milliseconds; frequency uses Hz.
                                    Amplitude is a level from 0 to 32767.
                                </p>
                                <p>
                                    The first pair starts at 0 ms. Times must
                                    not go backwards and must stay below 32767
                                    ms. A newline ends each row. Text from Audio
                                    Analysis may also show the 32767 end marker.
                                </p>
                                <p>
                                    Up to 50 partials and{" "}
                                    {MAX_HETRO_BYTES / 1024 / 1024} MB per file.
                                    Binary output uses little-endian 16-bit
                                    values.
                                </p>
                            </div>
                        </details>
                    </div>
                    <div
                        css={{
                            minWidth: 0,
                            display: "grid",
                            gap: 12,
                            alignContent: "start"
                        }}
                    >
                        {result && plots ? (
                            <>
                                <label>
                                    Partial
                                    <AudioSelect
                                        aria-label="Partial"
                                        value={selected}
                                        onChange={(event) =>
                                            setPartial(
                                                Number(event.target.value)
                                            )
                                        }
                                    >
                                        {Array.from(
                                            {
                                                length: result.analysis.partials
                                            },
                                            (_, index) => (
                                                <option
                                                    key={index}
                                                    value={index}
                                                >
                                                    Partial {index + 1}
                                                </option>
                                            )
                                        )}
                                    </AudioSelect>
                                </label>
                                <AnalysisGraph plot={plots[0]} />
                                <AnalysisGraph plot={plots[1]} />
                                <p
                                    role="status"
                                    css={{ color: theme.altTextColor }}
                                >
                                    {result.analysis.partials}{" "}
                                    {result.analysis.partials === 1
                                        ? "partial"
                                        : "partials"}
                                    , {result.analysis.duration.toFixed(3)} s.
                                    Preview matches the current text.
                                </p>
                            </>
                        ) : (
                            <div
                                css={{
                                    minHeight: 220,
                                    display: "grid",
                                    alignContent: "center",
                                    border: `1px dashed ${theme.line}`,
                                    borderRadius: 4,
                                    padding: 20
                                }}
                            >
                                <p role="status">
                                    {busy
                                        ? loading || preview.status
                                        : preview.error
                                          ? "Fix the text to update the analysis."
                                          : "Amplitude and frequency curves appear here."}
                                </p>
                            </div>
                        )}
                        <div
                            css={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                        >
                            <Button
                                variant="outlined"
                                startIcon={<DownloadRounded />}
                                disabled={!result || busy}
                                onClick={() => {
                                    if (result)
                                        download({
                                            name: result.name.replace(
                                                /\.het$/,
                                                ".txt"
                                            ),
                                            data: new TextEncoder().encode(
                                                result.text
                                            )
                                        });
                                }}
                            >
                                Download text
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadRounded />}
                                disabled={!result || busy}
                                onClick={() => {
                                    if (result) download(result);
                                }}
                            >
                                Download .het
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<SaveRounded />}
                                disabled={
                                    !result ||
                                    busy ||
                                    saved?.data === result.data
                                }
                                onClick={() => {
                                    if (result) {
                                        try {
                                            setSaved({
                                                data: result.data,
                                                name: onSave(result)
                                            });
                                        } catch (cause) {
                                            setError(
                                                cause instanceof Error
                                                    ? cause.message
                                                    : "Could not add the analysis to the project."
                                            );
                                        }
                                    }
                                }}
                            >
                                Add .het to project
                            </Button>
                        </div>
                        {saved && saved.data === result?.data && (
                            <p role="status">Added {saved.name}</p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
