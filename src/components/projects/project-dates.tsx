import React from "react";
import { projectDateMillis } from "./dates";

/** Show only recorded dates; missing history must not look like a recent edit. */
export const ProjectDates = ({
    project,
    className
}: {
    project: {
        created?: unknown;
        lastModified?: number | null;
        cachedProjectLastModified?: number;
    };
    className?: string;
}) => {
    const dates = [
        ["Created", projectDateMillis(project.created)],
        [
            "Last edited",
            projectDateMillis(
                project.lastModified ?? project.cachedProjectLastModified
            )
        ]
    ] as const;
    if (dates.every(([, date]) => date === undefined)) return null;
    return (
        <div
            className={className}
            css={{
                display: "flex",
                flexWrap: "wrap",
                gap: "2px 14px",
                fontSize: 12,
                lineHeight: 1.5
            }}
        >
            {dates.map(([label, millis]) => {
                if (millis === undefined) return null;
                const date = new Date(millis);
                return (
                    <span key={label}>
                        {label}{" "}
                        <time
                            dateTime={date.toISOString()}
                            title={date.toLocaleString()}
                        >
                            {date.toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                            })}
                        </time>
                    </span>
                );
            })}
        </div>
    );
};
