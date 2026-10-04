import { useEffect, useState } from "react";
import { Box, ClickAwayListener, Tooltip } from "@mui/material";
import {
    projectCreatedDate,
    projectFullCreatedDate,
    projectDateMillis,
    projectLastEdited
} from "./dates";

const cardDateFormat = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric"
});

/** Show the creation date and reveal the last edit on hover, focus, or tap. */
export const ProjectDates = ({
    project,
    className,
    onCard = false,
    compact = false
}: {
    project: {
        created?: unknown;
        lastModified?: number | null;
        cachedProjectLastModified?: number;
    };
    className?: string;
    onCard?: boolean;
    compact?: boolean;
}) => {
    const [open, setOpen] = useState(false);
    const [now, setNow] = useState(Date.now);
    const created = projectDateMillis(project.created);
    const edited = projectDateMillis(
        project.lastModified ?? project.cachedProjectLastModified
    );
    useEffect(() => {
        if (created === undefined && edited === undefined) return;
        const timer = window.setInterval(() => setNow(Date.now()), 60_000);
        return () => window.clearInterval(timer);
    }, [created, edited]);
    if (created === undefined && edited === undefined) return null;
    const creationDate =
        created === undefined
            ? "Date unknown"
            : projectCreatedDate(created, now);
    const visibleDate =
        (onCard || (compact && creationDate !== "today")) &&
        created !== undefined
            ? cardDateFormat.format(created)
            : creationDate;
    const dates = [
        [
            "Created",
            created,
            created === undefined ? "Unknown" : projectFullCreatedDate(created)
        ],
        [
            "Last edited",
            edited,
            edited === undefined ? "Unknown" : projectLastEdited(edited, now)
        ]
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
                        {dates.map(([label, value, text]) => (
                            <div key={label}>
                                {label}:{" "}
                                {value === undefined ? (
                                    "Unknown"
                                ) : (
                                    <time
                                        dateTime={new Date(value).toISOString()}
                                    >
                                        {text}
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
                            : `Created ${creationDate}. Show project dates`
                    }
                    onClick={() => setOpen(true)}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        width: "fit-content",
                        maxWidth: "100%",
                        minWidth: 0,
                        px: 0.75,
                        py: 0.25,
                        my: onCard ? 0 : 0.5,
                        whiteSpace: onCard || compact ? "nowrap" : undefined,
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
                        }
                    }}
                >
                    {created === undefined ? (
                        creationDate
                    ) : (
                        <time dateTime={new Date(created).toISOString()}>
                            {visibleDate}
                        </time>
                    )}
                </Box>
            </Tooltip>
        </ClickAwayListener>
    );
};
