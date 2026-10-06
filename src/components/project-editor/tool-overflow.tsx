import { useId, useLayoutEffect, useRef, useState } from "react";
import { useTheme } from "@emotion/react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ExpandLessRounded from "@mui/icons-material/ExpandLessRounded";
import { activityButton } from "./styles";

export type ToolLauncher = {
    type: string;
    label: string;
    Icon: React.ElementType;
};

/** Fit whole tool buttons into the available footer space, reserving room for More. */
export function visibleToolCount(
    widths: number[],
    available: number,
    more: number
) {
    if (widths.reduce((sum, width) => sum + width, 0) <= available)
        return widths.length;
    let used = more;
    let count = 0;
    for (const width of widths) {
        if (used + width > available) break;
        used += width;
        count++;
    }
    return count;
}

/** Measure actual labels so zoom, fonts and the WebMCP status all affect overflow. */
export function ToolOverflow({
    items,
    active,
    onSelect
}: {
    items: ToolLauncher[];
    active?: string;
    onSelect: (type: string) => void;
}) {
    const theme = useTheme();
    const focusMore = useRef(false);
    const id = useId();
    const container = useRef<HTMLDivElement>(null);
    const measurement = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const [count, setCount] = useState(0);
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    useLayoutEffect(() => {
        const root = container.current;
        const row = measurement.current;
        if (!root || !row) return;
        const measure = () => {
            const widths = Array.from(row.children).map(
                (element) => element.getBoundingClientRect().width
            );
            const next = visibleToolCount(
                widths.slice(0, -1),
                root.clientWidth,
                widths.at(-1) || 70
            );
            // Keep keyboard focus reachable when its button moves into the menu.
            const focused = document.activeElement;
            if (focused instanceof HTMLElement && root.contains(focused)) {
                const index = Number(focused.dataset.toolIndex);
                if (Number.isFinite(index) && index >= next)
                    focusMore.current = true;
            }
            setCount(next);
        };
        const observer = new ResizeObserver(measure);
        observer.observe(root);
        for (const child of Array.from(row.children)) observer.observe(child);
        measure();
        return () => observer.disconnect();
    }, [items]);
    useLayoutEffect(() => {
        if (focusMore.current) {
            trigger.current?.focus();
            focusMore.current = false;
        }
    }, [count]);
    const overflow = items.slice(count);
    const hasActive = overflow.some((item) => item.type === active);
    return (
        <div
            ref={container}
            css={{
                flex: "1 1 0",
                minWidth: 0,
                position: "relative",
                overflow: "hidden",
                display: "flex"
            }}
        >
            <div
                ref={measurement}
                aria-hidden="true"
                css={{
                    position: "absolute",
                    visibility: "hidden",
                    display: "flex",
                    width: "max-content",
                    pointerEvents: "none"
                }}
            >
                {[
                    ...items.map(({ type, label, Icon }) => (
                        <button
                            key={type}
                            type="button"
                            tabIndex={-1}
                            css={activityButton({
                                active: false,
                                compact: false
                            })}
                        >
                            <Icon fontSize="small" />
                            <span>{label}</span>
                        </button>
                    )),
                    <button
                        key="more"
                        type="button"
                        tabIndex={-1}
                        css={activityButton({ active: false, compact: false })}
                    >
                        <span>More</span>
                        <ExpandLessRounded fontSize="small" />
                    </button>
                ]}
            </div>
            {items.slice(0, count).map(({ type, label, Icon }, index) => (
                <button
                    key={type}
                    id={`sidebar-bottom-${type}`}
                    data-testid={`sidebar-bottom-${type}`}
                    data-tool-index={index}
                    type="button"
                    aria-label={label}
                    aria-pressed={type === active}
                    onClick={() => onSelect(type)}
                    css={activityButton({
                        active: type === active,
                        compact: false
                    })}
                >
                    <Icon fontSize="small" />
                    <span>{label}</span>
                </button>
            ))}
            <button
                ref={trigger}
                type="button"
                aria-label="More tools"
                aria-haspopup="menu"
                aria-expanded={Boolean(anchor) && overflow.length > 0}
                aria-controls={anchor ? id : undefined}
                onClick={(event) => setAnchor(event.currentTarget)}
                onKeyDown={(event) => {
                    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                        event.preventDefault();
                        setAnchor(event.currentTarget);
                    }
                }}
                css={[
                    activityButton({ active: hasActive, compact: false }),
                    { display: overflow.length ? "inline-flex" : "none" }
                ]}
            >
                <span>More</span>
                <ExpandLessRounded fontSize="small" />
            </button>
            <Menu
                id={id}
                PaperProps={{
                    sx: {
                        background: theme.headerBackground,
                        color: theme.textColor,
                        border: `1px solid ${theme.line}`,
                        "& .MuiListItemIcon-root": {
                            color: theme.altTextColor
                        },
                        "& .MuiMenuItem-root": { fontSize: 12 },
                        "& .Mui-selected, & .MuiMenuItem-root:hover": {
                            background: theme.highlightBackgroundAlt
                        }
                    }
                }}
                anchorEl={anchor}
                open={Boolean(anchor) && overflow.length > 0}
                onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: "top", horizontal: "left" }}
                transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                MenuListProps={{ "aria-label": "More tools" }}
            >
                {overflow.map(({ type, label, Icon }) => (
                    <MenuItem
                        key={type}
                        selected={type === active}
                        onClick={() => {
                            setAnchor(null);
                            onSelect(type);
                        }}
                    >
                        <ListItemIcon>
                            <Icon fontSize="small" />
                        </ListItemIcon>
                        {label}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}
