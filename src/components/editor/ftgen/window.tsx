import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@emotion/react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import LinearProgress from "@mui/material/LinearProgress";
import CloseIcon from "@mui/icons-material/Close";
import MinimizeIcon from "@mui/icons-material/Minimize";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";
import { TableClient } from "./client";
import { tableRequest, type TableRequest } from "./source";
import type { PlotSnapshot } from "./extension";
import { plotGuide } from "./annotations";
import { TableGraph } from "./graph";

type Rect = { left: number; top: number; width: number; height: number };
const clampRect = (rect: Rect): Rect => {
    const width = Math.min(Math.max(300, rect.width), window.innerWidth - 16);
    const height = Math.min(
        Math.max(340, rect.height),
        window.innerHeight - 16
    );
    return {
        width,
        height,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: Math.max(8, Math.min(rect.top, window.innerHeight - height - 8))
    };
};
export default function TablePlotWindow({
    snapshot,
    onClose
}: {
    snapshot: PlotSnapshot;
    onClose: () => void;
}) {
    const theme = useTheme();
    const [rect, setRect] = useState(() =>
        clampRect({
            left: window.innerWidth / 2 - 360,
            top: 100,
            width: 720,
            height: 440
        })
    );
    const [full, setFull] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [result, setResult] = useState<{
        samples: Float64Array;
        request: TableRequest;
    }>();
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);
    const frame = useRef<HTMLDivElement>(null);
    const title = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        title.current?.focus({ preventScroll: true });
    }, [minimized]);
    const drag = useRef<{
        x: number;
        y: number;
        rect: Rect;
        resize: boolean;
    }>();
    const client = useMemo(() => new TableClient(), []);
    const guide = useMemo(
        () =>
            result
                ? plotGuide(result.request, result.samples.length - 1)
                : undefined,
        [result]
    );
    // The request key avoids rebuilding for unrelated edits or whitespace changes.
    const prepared = useMemo(() => {
        try {
            return {
                key: JSON.stringify(
                    tableRequest(
                        snapshot.text,
                        snapshot.filename,
                        snapshot.selected
                    )
                ),
                error: ""
            };
        } catch (e) {
            return {
                key: "",
                error:
                    e instanceof Error
                        ? e.message
                        : "Finish the table statement to preview it."
            };
        }
    }, [snapshot]);
    useEffect(() => {
        if (minimized) {
            client.dispose();
            return;
        }
        let cancelled = false;
        setBusy(true);
        setError("");
        const timer = setTimeout(async () => {
            try {
                if (prepared.error) throw new Error(prepared.error);
                const request = JSON.parse(prepared.key) as TableRequest;
                const samples = await client.generate(request);
                if (!cancelled) setResult({ samples, request });
            } catch (e) {
                if (!cancelled) {
                    setResult(undefined);
                    setError(
                        e instanceof Error ? e.message : "Table preview failed."
                    );
                }
            } finally {
                if (!cancelled) setBusy(false);
            }
        }, 350);
        return () => {
            cancelled = true;
            clearTimeout(timer);
            client.cancelPending();
        };
    }, [prepared.key, prepared.error, client, minimized]);
    useEffect(() => () => client.dispose(), [client]);
    useEffect(() => {
        const resize = () => setRect((value) => clampRect(value));
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);
    const startDrag = (event: PointerEvent<HTMLElement>, resize = false) => {
        if (
            full ||
            minimized ||
            event.button !== 0 ||
            (!resize && (event.target as Element).closest("button"))
        )
            return;
        drag.current = { x: event.clientX, y: event.clientY, rect, resize };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
    };
    const move = (event: PointerEvent<HTMLElement>) => {
        const active = drag.current;
        if (!active || !frame.current) return;
        const dx = event.clientX - active.x,
            dy = event.clientY - active.y;
        const next = clampRect({
            ...active.rect,
            ...(active.resize
                ? {
                      width: active.rect.width + dx,
                      height: active.rect.height + dy
                  }
                : { left: active.rect.left + dx, top: active.rect.top + dy })
        });
        Object.assign(
            frame.current.style,
            Object.fromEntries(
                Object.entries(next).map(([key, value]) => [key, `${value}px`])
            )
        );
    };
    const finishDrag = () => {
        if (!drag.current || !frame.current) return;
        const box = frame.current.getBoundingClientRect();
        drag.current = undefined;
        setRect(
            clampRect({
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height
            })
        );
    };
    const button = (
        label: string,
        action: () => void,
        icon: React.ReactNode
    ) => (
        <Tooltip title={label}>
            <IconButton
                aria-label={label}
                onClick={action}
                size="small"
                css={{
                    color: theme.altTextColor,
                    width: 32,
                    height: 32,
                    "&:hover": {
                        color: theme.textColor,
                        background: theme.buttonBackgroundHover
                    }
                }}
            >
                {icon}
            </IconButton>
        </Tooltip>
    );
    const resizeHandle = !full && (
        <IconButton
            disableRipple
            aria-label="Resize table plot"
            title="Drag to resize, or use arrow keys"
            onPointerDown={(event) => startDrag(event, true)}
            onPointerMove={move}
            onPointerUp={finishDrag}
            onLostPointerCapture={finishDrag}
            onKeyDown={(event) => {
                if (
                    [
                        "ArrowLeft",
                        "ArrowRight",
                        "ArrowUp",
                        "ArrowDown"
                    ].includes(event.key)
                ) {
                    event.preventDefault();
                    setRect((r) =>
                        clampRect({
                            ...r,
                            width:
                                r.width +
                                (event.key === "ArrowLeft"
                                    ? -20
                                    : event.key === "ArrowRight"
                                      ? 20
                                      : 0),
                            height:
                                r.height +
                                (event.key === "ArrowUp"
                                    ? -20
                                    : event.key === "ArrowDown"
                                      ? 20
                                      : 0)
                        })
                    );
                }
            }}
            css={{
                width: 24,
                height: 24,
                padding: 2,
                flexShrink: 0,
                cursor: "nwse-resize",
                touchAction: "none",
                color: theme.altTextColor,
                "&:hover": { color: theme.textColor },
                "&:focus-visible": {
                    outline: `1px solid ${theme.altTextColor}`,
                    outlineOffset: -2
                }
            }}
        >
            <KeyboardDoubleArrowDownIcon
                css={{
                    fontSize: 18,
                    transform: "rotate(-45deg)"
                }}
            />
        </IconButton>
    );
    return createPortal(
        <div
            ref={frame}
            role="dialog"
            aria-modal="false"
            aria-label={`Function table ${snapshot.selected.name}`}
            onKeyDown={(event) => {
                if (event.key === "Escape") {
                    event.stopPropagation();
                    onClose();
                }
            }}
            style={
                minimized
                    ? {
                          right: 16,
                          bottom: 16,
                          width: Math.min(360, window.innerWidth - 32)
                      }
                    : full
                      ? { inset: 8 }
                      : rect
            }
            css={{
                position: "fixed",
                zIndex: 1400,
                display: "flex",
                flexDirection: "column",
                background: theme.background,
                color: theme.textColor,
                fontFamily: theme.font.regular,
                border: `1px solid ${theme.line}`,
                borderRadius: 10,
                boxShadow: "0 12px 48px #0005",
                overflow: "auto",
                boxSizing: "border-box"
            }}
        >
            <header
                onPointerDown={startDrag}
                onPointerMove={move}
                onPointerUp={finishDrag}
                onLostPointerCapture={finishDrag}
                css={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px 10px 18px",
                    background: theme.headerBackground,
                    cursor: full || minimized ? "default" : "move",
                    touchAction: "none",
                    flexShrink: 0
                }}
            >
                <ShowChartIcon css={{ color: theme.iRateVar, fontSize: 20 }} />
                <span
                    ref={title}
                    tabIndex={0}
                    title="Drag to move. Use arrow keys here to move the window."
                    onKeyDown={(event) => {
                        if (
                            !full &&
                            !minimized &&
                            [
                                "ArrowLeft",
                                "ArrowRight",
                                "ArrowUp",
                                "ArrowDown"
                            ].includes(event.key)
                        ) {
                            event.preventDefault();
                            setRect((r) =>
                                clampRect({
                                    ...r,
                                    left:
                                        r.left +
                                        (event.key === "ArrowLeft"
                                            ? -20
                                            : event.key === "ArrowRight"
                                              ? 20
                                              : 0),
                                    top:
                                        r.top +
                                        (event.key === "ArrowUp"
                                            ? -20
                                            : event.key === "ArrowDown"
                                              ? 20
                                              : 0)
                                })
                            );
                        }
                    }}
                    css={{
                        font: `500 13px ${theme.font.monospace}`,
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                    }}
                >
                    {snapshot.selected.name}
                    {snapshot.selected.kind === "score" && guide
                        ? ` ${guide.name}`
                        : ""}
                </span>
                {minimized ? (
                    button(
                        "Restore table plot",
                        () => setMinimized(false),
                        <OpenInFullIcon fontSize="small" />
                    )
                ) : (
                    <>
                        {button(
                            "Minimize table plot",
                            () => setMinimized(true),
                            <MinimizeIcon fontSize="small" />
                        )}
                        {button(
                            full ? "Exit full screen" : "Full screen",
                            () => setFull(!full),
                            full ? (
                                <FullscreenExitIcon fontSize="small" />
                            ) : (
                                <FullscreenIcon fontSize="small" />
                            )
                        )}
                    </>
                )}
                {button(
                    "Close table plot",
                    onClose,
                    <CloseIcon fontSize="small" />
                )}
            </header>
            {!minimized && (
                <>
                    <div css={{ height: 2, flexShrink: 0 }}>
                        {busy && (
                            <LinearProgress
                                aria-label="Generating function table"
                                css={{
                                    height: 2,
                                    background: theme.line,
                                    "& .MuiLinearProgress-bar": {
                                        background: theme.iRateVar
                                    },
                                    "@media (prefers-reduced-motion: reduce)": {
                                        "& .MuiLinearProgress-bar": {
                                            animation: "none",
                                            transform: "none"
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                    <div
                        css={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "baseline",
                            gap: "6px 12px",
                            padding: "16px 20px 12px",
                            flexShrink: 0
                        }}
                    >
                        <strong css={{ fontSize: 13 }}>
                            {guide?.detail || "Function table"}
                        </strong>
                        <span
                            css={{
                                color: theme.altTextColor,
                                font: `11px ${theme.font.monospace}`,
                                marginLeft: "auto"
                            }}
                        >
                            {guide?.name}
                            {result
                                ? ` · ${(result.samples.length - 1).toLocaleString()} samples`
                                : ""}
                        </span>
                    </div>
                    {error ? (
                        <p
                            role="status"
                            css={{
                                margin: "auto 24px",
                                padding: "24px 0",
                                color: theme.altTextColor,
                                fontSize: 13,
                                lineHeight: 1.7
                            }}
                        >
                            {error}
                        </p>
                    ) : result && guide ? (
                        <div
                            aria-busy={busy}
                            css={{
                                display: "flex",
                                flexDirection: "column",
                                minHeight: 0,
                                flex: 1,
                                opacity: busy ? 0.45 : 1,
                                transition: "opacity 160ms ease",
                                "@media (prefers-reduced-motion: reduce)": {
                                    transition: "none"
                                }
                            }}
                        >
                            <TableGraph
                                samples={result.samples}
                                guide={guide}
                                resizeHandle={resizeHandle}
                            />
                        </div>
                    ) : (
                        <p
                            role="status"
                            css={{
                                margin: "auto",
                                color: theme.altTextColor,
                                fontSize: 13
                            }}
                        >
                            Generating table…
                        </p>
                    )}
                    {(!result || error) && !full && (
                        <div
                            css={{
                                display: "flex",
                                justifyContent: "flex-end",
                                padding: "8px 12px",
                                flexShrink: 0
                            }}
                        >
                            {resizeHandle}
                        </div>
                    )}
                </>
            )}
        </div>,
        document.body
    );
}
