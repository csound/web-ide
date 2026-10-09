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
import type { AudioSource } from "../audio-tools/audio-tool";
import type { ToolFile } from "../audio-tools/types";
import { useDebouncedTask } from "../audio-tools/use-debounced-task";
import { checkLpcSize, exampleText, MAX_LPC_BYTES } from "./format";
import { openLpcFile, updateLpc } from "./client";
import { FramePreview } from "./frame-preview";

const language = [
    StreamLanguage.define({
        token(stream) {
            if (stream.match(/[A-Za-z][A-Za-z0-9]*/)) return "keyword";
            if (stream.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i))
                return "number";
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

/** One editor for both LPC conversion directions, with a timeline of the current valid edits. */
export default function LpcTool({
    sources = [],
    onSave
}: {
    sources?: AudioSource[];
    onSave: (file: ToolFile) => string;
}) {
    const theme = useTheme();
    const [text, setText] = useState("");
    const [baseline, setBaseline] = useState("");
    const [name, setName] = useState("analysis.lpc");
    const [revealLine, setRevealLine] = useState<{ line: number }>();
    const [loading, setLoading] = useState("");
    const [error, setError] = useState("");

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
    const preview = useDebouncedTask(request, updateLpc);
    const result = preview.value;
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
            const loaded = await openLpcFile(
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
        const url = URL.createObjectURL(new Blob([file.data]));
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
            aria-label="LPC editor"
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
                "& .MuiButton-root.Mui-disabled": {
                    color: theme.disabledTextColor
                },
                "& button:hover": { background: theme.buttonBackgroundHover },
                "& button:active": { transform: "scale(0.98)" },
                "& button:focus-visible, & select:focus-visible, & input:focus-visible, & summary:focus-visible":
                    {
                        outline: `2px solid ${theme.textColor}`,
                        outlineOffset: 2
                    },
                "& label": { display: "grid", gap: 6 },
                "& select, & input[type=number]": {
                    boxSizing: "border-box",
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
                "& .lpc-panes": {
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                    gap: 16
                },
                "@container (max-width: 620px)": {
                    "& .lpc-panes": { gridTemplateColumns: "minmax(0, 1fr)" }
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
                        <strong css={{ fontSize: 14 }}>LPC editor</strong>
                        <p css={{ color: theme.altTextColor }}>
                            Edit LPC frames and inspect pitch, level, and filter
                            data.
                        </p>
                        {text && (
                            <p
                                css={{
                                    color: theme.altTextColor,
                                    overflowWrap: "anywhere"
                                }}
                            >
                                {name}
                            </p>
                        )}
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
                        aria-label="Open LPC or text file"
                        accept=".lpc,.txt,.csv"
                        hidden
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file)
                                void load({
                                    id: file.name,
                                    name: file.name,
                                    load: async (signal) => {
                                        checkLpcSize(file.size);
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
                <div css={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadRounded />}
                        disabled={!result || busy}
                        onClick={() => {
                            if (result)
                                download({
                                    name: result.name.replace(/\.lpc$/, ".txt"),
                                    data: new TextEncoder().encode(result.text)
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
                        Download .lpc
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<SaveRounded />}
                        disabled={
                            !result || busy || saved?.data === result.data
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
                        Add .lpc to project
                    </Button>
                </div>
                {saved && saved.data === result?.data && (
                    <p role="status">Added {saved.name}</p>
                )}
                <div className="lpc-panes">
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
                                revealLine={revealLine}
                                label="LPC text"
                                value={text}
                                onChange={loading ? undefined : edit}
                                language={language}
                                hint="Open an analysis, paste LPC text, or try the example."
                            />
                        </div>
                        {!text && (
                            <Button
                                variant="outlined"
                                disabled={Boolean(loading)}
                                onClick={() => {
                                    setText(exampleText);
                                    setBaseline(exampleText);
                                    setName("example.lpc");
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
                                    The first five lines describe the analysis.
                                    Keep the label lines. Each later row holds
                                    one complete frame.
                                </p>
                                <p>
                                    The first four values are residual RMS,
                                    source RMS, prediction error, and pitch in
                                    Hz. The remaining values are filter data in
                                    Csound's storage order.
                                </p>
                                <p>
                                    Magic 999 stores filter coefficients. Magic
                                    2399 stores pole magnitude/phase pairs, with
                                    phase in radians. Frame time is its
                                    zero-based index divided by FrameRate.
                                </p>
                                <p>
                                    Duration records the source length; the
                                    number of rows sets the available frames.
                                    HeaderExtraHex preserves optional header
                                    bytes. Keep it unchanged unless you mean to
                                    edit them.
                                </p>
                                <p>
                                    This editor's CSV keeps full 64-bit
                                    precision. It opens headered, little-endian
                                    LPC files from Csound, including the IDE's
                                    Audio Analysis tool. 32-bit and headerless
                                    files are not supported. Up to 1,000,000
                                    values and {MAX_LPC_BYTES / 1024 / 1024} MB
                                    per file.
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
                        {result ? (
                            <FramePreview
                                analysis={result.analysis}
                                onRevealRow={(line) => setRevealLine({ line })}
                            />
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
                                          : "Pitch, level, and frame data appear here when the text is valid."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
