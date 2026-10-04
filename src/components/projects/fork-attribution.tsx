import { useEffect, useState } from "react";
import { Link } from "react-router";
import styled from "@emotion/styled";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import Tooltip from "@mui/material/Tooltip";
import { subscribeToForkSource, ForkSource } from "./fork-api";
import { projectDateMillis } from "./dates";

const Attribution = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    max-width: 100%;
    font-size: 12px;
    line-height: 1.5;
    color: inherit;
    svg {
        font-size: 14px;
        flex-shrink: 0;
    }
    > span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    a {
        color: inherit;
        text-underline-offset: 2px;
    }
    a:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
    }
`;

interface ForkAttributionProps {
    forkedFrom?: string;
    forkedAt?: unknown;
    compact?: boolean;
    className?: string;
}

export function ForkAttribution(properties: ForkAttributionProps) {
    return properties.forkedFrom ? (
        <SourceAttribution key={properties.forkedFrom} {...properties} />
    ) : null;
}

function SourceAttribution({
    forkedFrom,
    forkedAt,
    compact = false,
    className
}: ForkAttributionProps) {
    const [source, setSource] = useState<ForkSource>();
    useEffect(() => {
        if (!forkedFrom) return;
        return subscribeToForkSource(forkedFrom, setSource);
    }, [forkedFrom]);
    if (!forkedFrom) return null;
    const current = source?.id === forkedFrom ? source : undefined;
    const label =
        current?.status === "public"
            ? current.name
            : current?.status === "hidden"
              ? "'hidden project'"
              : current?.status === "error"
                ? "an unavailable project"
                : "…";
    const date = projectDateMillis(forkedAt);
    const title = `Forked from ${label}${date === undefined ? "" : ` on ${new Date(date).toLocaleDateString()}`}`;
    const attribution = (
        <Attribution
            className={className}
            title={compact ? undefined : title}
            tabIndex={compact && current?.status !== "public" ? 0 : undefined}
        >
            <CallSplitIcon />
            <span>
                {!compact && "Forked from "}
                {current?.status === "public" ? (
                    <Link
                        to={`/editor/${encodeURIComponent(forkedFrom)}`}
                        aria-label={compact ? title : undefined}
                    >
                        {compact ? "Forked" : label}
                    </Link>
                ) : compact ? (
                    "Forked"
                ) : (
                    label
                )}
            </span>
        </Attribution>
    );
    return compact ? (
        <Tooltip title={title} enterTouchDelay={0}>
            {attribution}
        </Tooltip>
    ) : (
        attribution
    );
}
