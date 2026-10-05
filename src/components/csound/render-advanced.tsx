import { useEffect, useRef, useState } from "react";
import { useTheme } from "@emotion/react";
import { Button, TextField } from "@mui/material";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { csoundScoLanguage } from "@kunstmusik/codemirror-lang-csound";
import { csoundRateHighlighting } from "@comp/editor/csound-highlighting";
import type { IDocument } from "@comp/projects/types";
import { FieldLabel } from "./render-field";
import { editorStyle } from "@styles/code-mirror-painter";
import { scoreFromCsd, type RenderSettings } from "./render-settings";

function ScoreEditor({
    value,
    onChange
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const parent = useRef<HTMLDivElement>(null);
    const initial = useRef(value);
    const callback = useRef(onChange);
    callback.current = onChange;
    const theme = useTheme();
    useEffect(() => {
        if (!parent.current) return;
        const view = new EditorView({
            parent: parent.current,
            state: EditorState.create({
                doc: initial.current,
                extensions: [
                    csoundScoLanguage,
                    csoundRateHighlighting(),
                    lineNumbers(),
                    history(),
                    keymap.of([...defaultKeymap, ...historyKeymap]),
                    EditorView.contentAttributes.of({
                        "aria-label": "Render score",
                        "aria-multiline": "true"
                    }),
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            initial.current = update.state.doc.toString();
                            callback.current(initial.current);
                        }
                    }),
                    EditorView.theme(
                        {
                            "&": {
                                height: "220px",
                                fontSize: "12px",
                                border: `1px solid ${theme.line}`,
                                borderRadius: "6px",
                                background: theme.background,
                                color: theme.textColor
                            },
                            "&.cm-focused": {
                                outline: `2px solid ${theme.tabHighlightActive}`
                            },
                            ".cm-scroller": {
                                overflow: "auto",
                                fontFamily: theme.font.monospace
                            },
                            ".cm-gutters": {
                                background: theme.background,
                                color: theme.altTextColor,
                                borderColor: theme.line
                            },
                            ".cm-cursor": { borderLeftColor: theme.textColor }
                        },
                        { dark: theme.mode === "dark" }
                    )
                ]
            })
        });
        return () => view.destroy();
    }, [theme]);
    return <div ref={parent} css={[editorStyle, { height: "auto" }]} />;
}

export function RenderAdvanced({
    documents,
    settings,
    onSettings,
    scores,
    onScores
}: {
    documents: IDocument[];
    settings: RenderSettings;
    onSettings: React.Dispatch<React.SetStateAction<RenderSettings>>;
    scores: Record<string, string>;
    onScores: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
    const [open, setOpen] = useState(false);
    const [documentUid, setDocumentUid] = useState(
        documents[0]?.documentUid ?? ""
    );
    const selected =
        documents.find((doc) => doc.documentUid === documentUid) ??
        documents[0];
    const override = selected ? scores[selected.documentUid] : undefined;
    return (
        <details onToggle={(event) => setOpen(event.currentTarget.open)}>
            <summary>Score &amp; macros</summary>
            {open && (
                <div className="advanced-body">
                    <p>
                        Override a track’s score for this render. Use{" "}
                        <code>a 0 0 32</code> to advance 32 beats without audio.
                        Tempo statements affect those beats. Advancing skips
                        sound generation, so effects do not warm up.
                    </p>
                    <p>
                        <code>e 120</code> can extend the last section to beat
                        120. To finish sooner, remove later events and shorten
                        notes that cross the end; an earlier e time alone does
                        not cut them off.
                    </p>
                    {documents.length > 1 && (
                        <TextField
                            label="Score for track"
                            select
                            fullWidth
                            size="small"
                            value={selected?.documentUid ?? ""}
                            onChange={(event) =>
                                setDocumentUid(event.target.value)
                            }
                            slotProps={{ select: { native: true } }}
                        >
                            {documents.map((doc) => (
                                <option
                                    key={doc.documentUid}
                                    value={doc.documentUid}
                                >
                                    {doc.filename}
                                </option>
                            ))}
                        </TextField>
                    )}
                    {selected &&
                        (override === undefined ? (
                            <Button
                                sx={{ my: 1, textTransform: "none" }}
                                onClick={() =>
                                    onScores((previous) => ({
                                        ...previous,
                                        [selected.documentUid]:
                                            scoreFromCsd(
                                                selected.currentValue
                                            ) ?? ""
                                    }))
                                }
                            >
                                Edit score for this render
                            </Button>
                        ) : (
                            <>
                                <p>{selected.filename} · Render-only score</p>
                                <ScoreEditor
                                    key={selected.documentUid}
                                    value={override}
                                    onChange={(value) =>
                                        onScores((previous) => ({
                                            ...previous,
                                            [selected.documentUid]: value
                                        }))
                                    }
                                />
                                <Button
                                    sx={{ my: 1, textTransform: "none" }}
                                    onClick={() =>
                                        onScores((previous) => {
                                            const next = { ...previous };
                                            delete next[selected.documentUid];
                                            return next;
                                        })
                                    }
                                >
                                    Use project score
                                </Button>
                            </>
                        ))}
                    <p>
                        Macro values apply to every selected track. Use one{" "}
                        <code>NAME: value</code> per line, with numbers or
                        expressions without spaces, such as{" "}
                        <code>FREQ: 440*2</code>.
                    </p>
                    <div className="fields">
                        <div>
                            <FieldLabel
                                id="render-omacros"
                                label="Orchestra macros"
                                help="Defines $NAME in the orchestra before compilation, like --omacro:NAME=value. The program must use the macro for it to affect the sound."
                            />
                            <TextField
                                id="render-omacros"
                                multiline
                                minRows={3}
                                maxRows={8}
                                fullWidth
                                size="small"
                                placeholder="FREQ: 440"
                                value={settings.orchestraMacros ?? ""}
                                onChange={(event) =>
                                    onSettings((previous) => ({
                                        ...previous,
                                        orchestraMacros: event.target.value
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <FieldLabel
                                id="render-smacros"
                                label="Score macros"
                                help="Defines $NAME in the score before sorting, like --smacro:NAME=value. Useful for tempo, duration, and other values referenced by score macros."
                            />
                            <TextField
                                id="render-smacros"
                                multiline
                                minRows={3}
                                maxRows={8}
                                fullWidth
                                size="small"
                                placeholder="TEMPO: 120"
                                value={settings.scoreMacros ?? ""}
                                onChange={(event) =>
                                    onSettings((previous) => ({
                                        ...previous,
                                        scoreMacros: event.target.value
                                    }))
                                }
                            />
                        </div>
                    </div>
                </div>
            )}
        </details>
    );
}
