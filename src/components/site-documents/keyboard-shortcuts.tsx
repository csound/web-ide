import React from "react";
import { css, Theme } from "@emotion/react";
import { isMac } from "@root/utils";

type ShortcutRow = {
    shortcut: string;
    action: string;
};

const shortcutRows: ShortcutRow[] = [
    {
        shortcut: isMac ? "ctrl-command-n" : "ctrl-alt-n",
        action: "New file"
    },
    {
        shortcut: isMac ? "ctrl-command-u" : "ctrl-alt-u",
        action: "Add file(s)"
    },
    {
        shortcut: isMac ? "command-e" : "ctrl-e",
        action: "Evaluate current line"
    },
    {
        shortcut: isMac ? "command-enter" : "ctrl-enter",
        action: "Evaluate current block"
    },
    {
        shortcut: isMac ? "ctrl-." : "alt-.",
        action: "Show opcode documentation for opcode at cursor"
    },
    {
        shortcut: isMac ? "command-; / opt-command-;" : "ctrl-; / ctrl-shift-;",
        action: "Toggle comment"
    },
    {
        shortcut: isMac ? "command-s" : "ctrl-s",
        action: "Save current document"
    },
    {
        shortcut: isMac ? "opt-command-s" : "ctrl-shift-s",
        action: "Save all documents"
    },
    {
        shortcut: isMac ? "command-r" : "ctrl-r",
        action: "Run/Restart realtime rendering"
    },
    {
        shortcut: isMac ? "command-p" : "ctrl-p",
        action: "Pause realtime rendering"
    }
];

const containerCss = css`
    width: 720px;
    max-width: calc(100vw - 60px);
`;

const headerCss = css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;

    @media (max-width: 760px) {
        flex-direction: column;
        gap: 10px;
    }
`;

const titleGroupCss = css`
    min-width: 0;
`;

const titleCss = css`
    margin: 0 0 8px;
`;

const descriptionCss = (theme: Theme) => css`
    margin: 0;
    color: ${theme.altTextColor};
    line-height: 1.45;
    max-width: 56ch;
`;

const platformBadgeCss = (theme: Theme) => css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: flex-start;
    min-height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid ${theme.line};
    background: ${theme.buttonBackground};
    color: ${theme.textColor};
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
`;

const listShellCss = (theme: Theme) => css`
    border: 1px solid ${theme.line};
    border-radius: 10px;
    overflow: hidden;
    background: ${theme.buttonBackground};
`;

const tableCss = css`
    width: 100%;
    border-collapse: collapse;
`;

const headCellCss = (theme: Theme) => css`
    padding: 12px 16px;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${theme.altTextColor};
    background: ${theme.background};
    border-bottom: 1px solid ${theme.line};

    @media (max-width: 760px) {
        &:last-of-type {
            display: none;
        }
    }
`;

const rowCss = (theme: Theme) => css`
    border-bottom: 1px solid ${theme.line};

    &:last-of-type {
        border-bottom: 0;
    }

    @media (max-width: 760px) {
        display: block;
        padding: 14px 16px;
    }
`;

const shortcutCellCss = css`
    width: 42%;
    padding: 14px 16px;
    vertical-align: top;

    @media (max-width: 760px) {
        display: block;
        width: auto;
        padding: 0 0 10px;
    }
`;

const actionCellCss = (theme: Theme) => css`
    padding: 14px 16px;
    vertical-align: top;
    color: ${theme.textColor};
    line-height: 1.4;

    @media (max-width: 760px) {
        display: block;
        padding: 0;
    }
`;

const shortcutGroupCss = css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
`;

const comboCss = css`
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
`;

const comboSeparatorCss = (theme: Theme) => css`
    color: ${theme.altTextColor};
    font-size: 12px;
    font-weight: 600;
`;

const plusCss = (theme: Theme) => css`
    color: ${theme.altTextColor};
    font-size: 12px;
    font-weight: 700;
`;

const keycapCss = (theme: Theme) => css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 28px;
    padding: 0 8px;
    border-radius: 7px;
    border: 1px solid ${theme.line};
    background: ${theme.background};
    color: ${theme.textColor};
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
`;

const renderShortcut = (shortcut: string) => {
    const combos = shortcut.split(" / ").map((combo) => combo.split("-"));

    return (
        <div css={shortcutGroupCss}>
            {combos.map((parts, comboIndex) => (
                <React.Fragment key={`${shortcut}-${comboIndex}`}>
                    {comboIndex > 0 && <span css={comboSeparatorCss}>or</span>}
                    <span css={comboCss}>
                        {parts.map((part, partIndex) => (
                            <React.Fragment
                                key={`${shortcut}-${comboIndex}-${part}`}
                            >
                                {partIndex > 0 && <span css={plusCss}>+</span>}
                                <kbd css={keycapCss}>{part}</kbd>
                            </React.Fragment>
                        ))}
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
};

export const KeyboardShortcuts = () => (
    <div css={containerCss}>
        <div css={headerCss}>
            <div css={titleGroupCss}>
                <h3 css={titleCss}>Editor Actions</h3>
                <p css={descriptionCss}>
                    Common editing, evaluation, and playback shortcuts for the
                    code editor.
                </p>
            </div>
            <div css={platformBadgeCss}>
                {isMac ? "macOS" : "Windows / Linux"}
            </div>
        </div>

        <div css={listShellCss}>
            <table css={tableCss}>
                <thead>
                    <tr>
                        <th css={headCellCss}>Shortcut</th>
                        <th css={headCellCss}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {shortcutRows.map(({ shortcut, action }) => (
                        <tr key={action} css={rowCss}>
                            <td css={shortcutCellCss}>
                                {renderShortcut(shortcut)}
                            </td>
                            <td css={actionCellCss}>{action}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);
