import { useCallback, useId, useMemo, useState } from "react";
import { useTheme } from "@emotion/react";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import LinearProgress from "@mui/material/LinearProgress";
import { csoundEditorLanguage } from "../editor/csound-language";
import {
    csbeatsLanguage,
    scotLanguage,
    scoreHighlighting
} from "../editor/score-languages";
import { AudioSelect } from "../audio-tools/audio-select";
import { useDebouncedTask } from "../audio-tools/use-debounced-task";
import { CodePane } from "./code-pane";
import { convertScore, scoreExamples } from "./convert";
import { isScoreProgram, type ScoreProgram } from "./programs";

const languages = {
    csbeats: [csbeatsLanguage, scoreHighlighting],
    scot: [scotLanguage, scoreHighlighting],
    scsort: csoundEditorLanguage("sco"),
    extract: csoundEditorLanguage("sco")
};
const descriptions = {
    csbeats: 'Use this source in <CsScore bin="csbeats">.',
    scot: 'Use this source in <CsScore bin="scot">.',
    scsort: "Sort events and expand score shorthand.",
    extract: "Keep selected instruments and a range of score beats."
};

export default function ScoreTool() {
    const theme = useTheme();
    const languageId = useId();
    const [program, setProgram] = useState<ScoreProgram>("csbeats");
    const [drafts, setDrafts] = useState({ ...scoreExamples });
    const [selection, setSelection] = useState("i 1");
    const source = drafts[program];
    const edit = useCallback(
        (text: string) =>
            setDrafts((current) => ({ ...current, [program]: text })),
        [program]
    );
    const request = useMemo(
        () =>
            source.trim()
                ? {
                      program,
                      source,
                      selection: program === "extract" ? selection : ""
                  }
                : undefined,
        [source, program, selection]
    );
    const result = useDebouncedTask(request, convertScore);
    const [copied, setCopied] = useState<string>();
    const [copyError, setCopyError] = useState("");
    const text = result.value?.text ?? "";
    const copy = async () => {
        setCopyError("");
        try {
            await navigator.clipboard.writeText(text);
            setCopied(text);
        } catch {
            setCopyError(
                "Could not copy. Select the output and copy it with your keyboard."
            );
        }
    };
    return (
        <section
            aria-label="Score converter"
            css={{
                height: "100%",
                minHeight: 0,
                containerType: "inline-size",
                color: theme.textColor,
                background: theme.background,
                fontFamily: theme.font.regular,
                fontSize: 13,
                "button, select, input": {
                    font: "inherit",
                    color: "inherit",
                    border: `1px solid ${theme.line}`,
                    background: theme.headerBackground,
                    borderRadius: 4,
                    minHeight: 32,
                    padding: "4px 10px"
                },
                button: {
                    display: "inline-flex",
                    gap: 6,
                    alignItems: "center",
                    cursor: "pointer"
                },
                "button:disabled": { opacity: 0.45, cursor: "default" },
                "button:hover:not(:disabled)": {
                    background: theme.highlightBackground
                },
                "button:focus-visible, select:focus-visible, input:focus-visible":
                    {
                        outline: `2px solid ${theme.textColor}`,
                        outlineOffset: 2
                    },
                select: { width: "100%" },
                ".score-panes": {
                    height: "100%",
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                    minHeight: 0
                },
                ".score-pane": {
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    minHeight: 0
                },
                ".score-output": { borderLeft: `1px solid ${theme.line}` },
                ".score-header": {
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: 48,
                    padding: "4px 12px",
                    boxSizing: "border-box",
                    borderBottom: `1px solid ${theme.line}`,
                    background: theme.headerBackground
                },
                ".score-code": { flex: 1, minHeight: 0, overflow: "hidden" },
                ".score-footer": {
                    padding: "8px 12px",
                    borderTop: `1px solid ${theme.line}`,
                    color: theme.altTextColor,
                    fontSize: 12
                },
                "@container (max-width: 540px)": {
                    ".score-panes": {
                        gridTemplateColumns: "minmax(0, 1fr)",
                        gridTemplateRows:
                            "minmax(180px, 1fr) minmax(180px, 1fr)",
                        overflow: "auto"
                    },
                    ".score-output": {
                        borderLeft: 0,
                        borderTop: `1px solid ${theme.line}`
                    }
                }
            }}
        >
            <div className="score-panes">
                <div className="score-pane">
                    <header className="score-header">
                        <label htmlFor={languageId}>Source language</label>
                        <AudioSelect
                            id={languageId}
                            aria-label="Source language"
                            value={program}
                            onChange={(event) => {
                                if (isScoreProgram(event.target.value))
                                    setProgram(event.target.value);
                                setCopyError("");
                                setCopied(undefined);
                            }}
                        >
                            <option value="csbeats">CsBeats</option>
                            <option value="scot">SCOT</option>
                            <option value="scsort">Csound score · Sort</option>
                            <option value="extract">
                                Csound score · Extract
                            </option>
                        </AudioSelect>
                    </header>
                    {program === "extract" && (
                        <div
                            css={{
                                padding: "8px 12px",
                                borderBottom: `1px solid ${theme.line}`
                            }}
                        >
                            <label
                                css={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10
                                }}
                            >
                                Selection
                                <input
                                    value={selection}
                                    onChange={(event) =>
                                        setSelection(event.target.value)
                                    }
                                    css={{
                                        flex: 1,
                                        minWidth: 0,
                                        fontFamily: `${theme.font.monospace} !important`
                                    }}
                                />
                            </label>
                            <div
                                css={{
                                    color: theme.altTextColor,
                                    fontSize: 12,
                                    marginTop: 6
                                }}
                            >
                                i: instruments · f: start section:beat · t: end
                                section:beat
                            </div>
                        </div>
                    )}
                    <div className="score-code">
                        <CodePane
                            key={program}
                            label="Score source"
                            value={source}
                            language={languages[program]}
                            onChange={edit}
                            hint="Enter a score to convert…"
                        />
                    </div>
                    <footer className="score-footer">
                        {descriptions[program]}
                    </footer>
                </div>
                <div
                    className="score-pane score-output"
                    aria-busy={result.pending}
                >
                    <header className="score-header">
                        <span>Csound score</span>
                        <button
                            type="button"
                            onClick={copy}
                            disabled={!text || result.pending}
                        >
                            {copied === text && text ? (
                                <CheckRounded fontSize="small" />
                            ) : (
                                <ContentCopyRounded fontSize="small" />
                            )}
                            {copied === text && text ? "Copied" : "Copy"}
                        </button>
                    </header>
                    <div css={{ height: 2, flexShrink: 0 }}>
                        {result.pending && (
                            <LinearProgress
                                aria-label="Converting score"
                                css={{ height: 2 }}
                            />
                        )}
                    </div>
                    <div className="score-code">
                        <CodePane
                            label="Generated score"
                            value={text}
                            language={languages.scsort}
                            hint={
                                result.error
                                    ? "Fix the source to generate a score."
                                    : result.pending
                                      ? "Converting…"
                                      : "The generated score appears here."
                            }
                        />
                    </div>
                    {result.error && (
                        <div
                            role="alert"
                            css={{
                                padding: 12,
                                maxHeight: 140,
                                overflow: "auto",
                                whiteSpace: "pre-wrap",
                                overflowWrap: "anywhere",
                                borderTop: `1px solid ${theme.line}`
                            }}
                        >
                            {result.error}
                            <button
                                type="button"
                                onClick={result.retry}
                                css={{ marginTop: 8 }}
                            >
                                Retry
                            </button>
                        </div>
                    )}
                    {copyError && (
                        <div role="alert" css={{ padding: 12 }}>
                            {copyError}
                        </div>
                    )}
                    {result.value?.log && (
                        <details className="score-footer">
                            <summary>Tool messages</summary>
                            <pre
                                css={{
                                    maxHeight: 100,
                                    overflow: "auto",
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere"
                                }}
                            >
                                {result.value.log}
                            </pre>
                        </details>
                    )}
                    <footer className="score-footer" role="status">
                        {result.pending
                            ? result.status
                            : result.error
                              ? "Conversion failed"
                              : text
                                ? "Up to date · Updates as you type"
                                : "Enter source to begin"}
                    </footer>
                </div>
            </div>
        </section>
    );
}
