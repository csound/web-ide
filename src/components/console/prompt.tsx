import {
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useSyncExternalStore
} from "react";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { consoleReadline } from "./readline";
import * as SS from "./styles";

export default function ConsolePrompt({ projectUid }: { projectUid: string }) {
    const {
        projectUid: runningProjectUid,
        request,
        draft,
        queued,
        submitting,
        error
    } = useSyncExternalStore(
        consoleReadline.subscribe,
        consoleReadline.getSnapshot
    );
    const input = useRef<HTMLTextAreaElement>(null);
    const caret = useRef<number | null>(null);
    const id = useId();
    const busy = submitting || queued > 0;
    const belongsToProject = runningProjectUid === projectUid;

    useEffect(() => {
        if (belongsToProject && request && !busy)
            input.current?.focus({ preventScroll: true });
    }, [belongsToProject, request, busy]);
    useLayoutEffect(() => {
        if (caret.current !== null) {
            input.current?.setSelectionRange(caret.current, caret.current);
            caret.current = null;
        }
    }, [draft]);

    if (!belongsToProject || (!request && !busy && !error)) return null;

    return (
        <form
            css={SS.promptContainer}
            aria-label="Csound input"
            onSubmit={(event) => {
                event.preventDefault();
                consoleReadline.submit();
            }}
            onKeyDown={(event) => event.stopPropagation()}
        >
            <div css={SS.promptRow}>
                <label htmlFor={id} css={SS.promptLabel}>
                    {request?.prompt || (
                        <ChevronRightRoundedIcon aria-hidden="true" />
                    )}
                </label>
                <TextareaAutosize
                    id={id}
                    ref={input}
                    css={SS.promptInput}
                    aria-label={request?.prompt || "Console input"}
                    aria-describedby={error ? `${id}-error` : undefined}
                    aria-invalid={Boolean(error)}
                    value={draft}
                    disabled={!request || busy}
                    minRows={1}
                    maxRows={5}
                    spellCheck={false}
                    autoComplete="off"
                    placeholder={
                        busy ? "Sending queued lines…" : "Type a response…"
                    }
                    onChange={(event) =>
                        consoleReadline.setDraft(event.target.value)
                    }
                    onKeyDown={(event) => {
                        if (
                            event.key !== "Enter" ||
                            event.nativeEvent.isComposing ||
                            event.keyCode === 229
                        )
                            return;
                        event.preventDefault();
                        if (event.shiftKey) {
                            const { selectionStart, selectionEnd } =
                                event.currentTarget;
                            caret.current = selectionStart + 1;
                            consoleReadline.setDraft(
                                `${draft.slice(0, selectionStart)}\n${draft.slice(selectionEnd)}`
                            );
                        } else {
                            consoleReadline.submit();
                        }
                    }}
                />
                <button
                    type="submit"
                    css={SS.promptSend}
                    disabled={!request || busy}
                    aria-label="Send input"
                    title="Send input (Enter)"
                >
                    <ArrowUpwardRoundedIcon fontSize="small" />
                </button>
            </div>
            {busy && (
                <div css={SS.promptStatus}>
                    <span role="status">
                        {queued > 0
                            ? `${queued} ${queued === 1 ? "line" : "lines"} queued`
                            : "Sending…"}
                    </span>
                    {queued > 0 && (
                        <button
                            type="button"
                            onClick={consoleReadline.clearQueue}
                        >
                            Clear queue
                        </button>
                    )}
                </div>
            )}
            {error && (
                <div css={SS.promptError} role="alert" id={`${id}-error`}>
                    {error}
                </div>
            )}
        </form>
    );
}
