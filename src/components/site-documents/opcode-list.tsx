import React, { useMemo, useState } from "react";
import { css, Theme } from "@emotion/react";

export interface OpcodeInfo {
    opname: string;
    outypes: string;
    intypes: string;
}

export interface OpcodeListProps {
    opcodes: OpcodeInfo[];
}

const containerCss = css`
    width: 640px;
    max-width: calc(100vw - 60px);
`;

const titleCss = css`
    margin: 0 0 12px;
`;

const searchCss = (theme: Theme) => css`
    width: 100%;
    box-sizing: border-box;
    padding: 6px 10px;
    margin-bottom: 14px;
    border-radius: 4px;
    border: 1px solid ${theme.line};
    background: transparent;
    color: inherit;
    font-size: 14px;
    &:focus {
        outline: none;
        border-color: ${theme.lineHover};
    }
`;

const listCss = css`
    max-height: 55vh;
    overflow-y: auto;
    font-family: monospace;
    font-size: 13px;
`;

const groupCss = css`
    margin-bottom: 10px;
`;

const opnameCss = css`
    font-weight: bold;
    margin-bottom: 2px;
`;

const signatureCss = css`
    padding-left: 16px;
    opacity: 0.8;
    white-space: nowrap;
`;

const countCss = css`
    font-size: 12px;
    opacity: 0.6;
    margin-bottom: 10px;
`;

export const OpcodeList = ({ opcodes }: OpcodeListProps) => {
    const [filter, setFilter] = useState("");

    // Group signatures by opcode name
    const grouped = useMemo(() => {
        const map = new Map<string, OpcodeInfo[]>();
        for (const entry of opcodes) {
            const existing = map.get(entry.opname);
            if (existing) {
                existing.push(entry);
            } else {
                map.set(entry.opname, [entry]);
            }
        }
        return map;
    }, [opcodes]);

    const filteredEntries = useMemo(() => {
        const q = filter.trim().toLowerCase();
        const entries = [...grouped.entries()].sort(([a], [b]) =>
            a.localeCompare(b)
        );
        return q
            ? entries.filter(([name]) => name.toLowerCase().includes(q))
            : entries;
    }, [filter, grouped]);

    return (
        <div css={containerCss}>
            <h3 css={titleCss}>Available Opcodes</h3>
            <input
                css={searchCss}
                type="text"
                placeholder="Filter opcodes…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                autoFocus
            />
            <p css={countCss}>
                {filteredEntries.length} / {grouped.size} opcodes
            </p>
            <div css={listCss}>
                {filteredEntries.map(([name, variants]) => (
                    <div key={name} css={groupCss}>
                        <div css={opnameCss}>{name}</div>
                        {variants.map((v, i) => (
                            <div key={i} css={signatureCss}>
                                {v.outypes || "_"} {name} {v.intypes || "_"}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
