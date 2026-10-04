import { css, type Theme } from "@emotion/react";

export const dialog = css`
    width: 580px;
    max-width: calc(100vw - 32px);
    h2 {
        margin: 0;
        font-size: 22px;
        font-weight: 600;
        letter-spacing: -0.4px;
    }
    h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
    }
`;
export const header = (theme: Theme) => css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    p {
        margin: 6px 0 24px;
        color: ${theme.altTextColor};
        font-size: 14px;
    }
`;
export const modeSwitch = (theme: Theme) => css`
    display: flex;
    width: 100%;
    button {
        flex: 1;
        gap: 8px;
        color: ${theme.altTextColor};
        border-color: ${theme.line};
        text-transform: none;
        font-size: 14px;
        padding: 10px 16px;
    }
    button.Mui-selected,
    button.Mui-selected:hover {
        color: ${theme.textColor};
        background: ${theme.highlightBackground};
    }
`;
export const body = css`
    padding: 24px 0;
`;
export const label = css`
    display: block;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
`;
export const help = (theme: Theme) => css`
    font-size: 13px;
    line-height: 1.6;
    color: ${theme.altTextColor};
    margin: 0 0 16px;
    &:last-child {
        margin: 16px 0 0;
    }
`;
export const listHeading = (theme: Theme) => css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    span {
        color: ${theme.altTextColor};
        font-size: 12px;
    }
`;
export const trackList = (theme: Theme) => css`
    list-style: none;
    padding: 0;
    margin: 0 0 20px;
    max-height: 280px;
    overflow: auto;
    li {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 48px;
        padding: 4px 6px;
        border-radius: 4px;
    }
    li:nth-of-type(odd) {
        background: ${theme.highlightBackground};
    }
    @media (max-width: 480px) {
        li {
            gap: 6px;
        }
    }
`;
export const number = (theme: Theme) => css`
    color: ${theme.altTextColor};
    font-family: ${theme.font.monospace};
    font-size: 12px;
    min-width: 22px;
    text-align: center;
    font-variant-numeric: tabular-nums;
`;
export const trackName = css`
    flex: 1;
    min-width: 0;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;
export const trackActions = css`
    display: flex;
    gap: 2px;
    button {
        width: 32px;
        height: 32px;
    }
`;
export const empty = (theme: Theme) => css`
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 24px 16px;
    margin-bottom: 20px;
    background: ${theme.highlightBackground};
    color: ${theme.altTextColor};
    font-size: 13px;
    border-radius: 6px;
`;
export const footer = (theme: Theme) => css`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    border-top: 1px solid ${theme.line};
    padding-top: 16px;
    button {
        text-transform: none;
    }
`;
export const srOnly = css`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
`;
