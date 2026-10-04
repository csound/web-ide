import { useEffect, useState } from "react";
import { Box, ClickAwayListener, Tooltip } from "@mui/material";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import { projectAge, projectDateMillis } from "./dates";

/** Keep the age visible and reveal exact dates on hover, focus, or tap. */
export const ProjectDates = ({
    project,
    className,
    onCard = false
}: {
    project: {
        created?: unknown;
        lastModified?: number | null;
        cachedProjectLastModified?: number;
    };
    className?: string;
    onCard?: boolean;
}) => {
    const [open, setOpen] = useState(false);
    const [now, setNow] = useState(Date.now);
    const created = projectDateMillis(project.created);
    const edited = projectDateMillis(
        project.lastModified ?? project.cachedProjectLastModified
    );
    useEffect(() => {
        if (created === undefined) return;
        const timer = window.setInterval(() => setNow(Date.now()), 60_000);
        return () => window.clearInterval(timer);
    }, [created]);
    if (created === undefined && edited === undefined) return null;
    const age =
        created === undefined ? "Age unknown" : projectAge(created, now);
    const dates = [
        ["Created", created],
        ["Last edited", edited]
    ] as const;
    return (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
            <Tooltip
                describeChild
                disableTouchListener
                arrow
                placement="top"
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                title={
                    <Box sx={{ display: "grid", gap: 0.5 }}>
                        {dates.map(([label, value]) => (
                            <div key={label}>
                                {label}:{" "}
                                {value === undefined ? (
                                    "Unknown"
                                ) : (
                                    <time
                                        dateTime={new Date(value).toISOString()}
                                    >
                                        {new Date(value).toLocaleString()}
                                    </time>
                                )}
                            </div>
                        ))}
                    </Box>
                }
            >
                <Box
                    component="button"
                    type="button"
                    className={className}
                    aria-label={
                        created === undefined
                            ? "Project creation date unknown. Show project dates"
                            : `Created ${age === "Just created" ? "just now" : age}. Show project dates`
                    }
                    onClick={() => setOpen(true)}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        width: "fit-content",
                        maxWidth: "100%",
                        minWidth: 0,
                        px: 0.75,
                        py: 0.25,
                        my: 0.5,
                        border: 1,
                        borderColor: onCard
                            ? "rgba(255,255,255,0.24)"
                            : "divider",
                        borderRadius: 1,
                        font: "inherit",
                        fontSize: 11,
                        lineHeight: 1.5,
                        color: onCard ? "#f3f4f6" : "text.secondary",
                        bgcolor: onCard
                            ? "rgba(12,16,20,0.65)"
                            : "action.hover",
                        cursor: "pointer",
                        textAlign: "left",
                        "&:hover, &:focus-visible": {
                            borderColor: "currentColor"
                        },
                        "&:focus-visible": {
                            outline: "2px solid currentColor",
                            outlineOffset: 2
                        },
                        "@media (prefers-reduced-motion: no-preference)": {
                            "& svg": { transition: "transform 140ms ease" },
                            "&:hover svg": { transform: "rotate(-15deg)" }
                        }
                    }}
                >
                    <HistoryRoundedIcon sx={{ fontSize: 14 }} />
                    {created === undefined ? (
                        age
                    ) : (
                        <time dateTime={new Date(created).toISOString()}>
                            {age}
                        </time>
                    )}
                </Box>
            </Tooltip>
        </ClickAwayListener>
    );
};
