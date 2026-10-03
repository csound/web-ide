import { css, Theme } from "@emotion/react";

export const player = (theme: Theme) => css`
    box-sizing: border-box;
    min-height: 100dvh;
    padding: 20px;
    background: ${theme.background};
    color: ${theme.textColor};
    font-family: ${theme.font.regular};

    header,
    nav {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
    }
    header {
        justify-content: space-between;
        font-size: 12px;
    }
    .brand {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
    }
    .project-heading {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-top: 20px;
    }
    .artwork {
        position: relative;
        flex: 0 0 52px;
        height: 52px;
        overflow: hidden;
        border-radius: 6px;
    }
    a {
        color: ${theme.textColor};
        text-decoration: underline;
    }
    h1 {
        margin: 0;
        font-size: 20px;
        line-height: 1.3;
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    p {
        margin: 8px 0;
        font-size: 13px;
    }
    .description {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        overflow-wrap: anywhere;
    }
    label {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        margin: 14px 0;
        font-size: 13px;
    }
    select {
        min-width: 0;
        max-width: 100%;
        width: 100%;
        min-height: 36px;
        padding: 6px;
        background: ${theme.dropdownBackground};
        color: ${theme.textColor};
        border: 1px solid ${theme.altTextColor};
        border-radius: 6px;
    }
    a:focus-visible,
    select:focus-visible,
    summary:focus-visible {
        outline: 2px solid ${theme.tabHighlightActive};
        outline-offset: 2px;
    }
    .MuiButton-root {
        min-height: 44px;
        text-transform: none;
        box-shadow: none;
    }
    .MuiButton-contained .MuiSvgIcon-root {
        fill: currentColor;
    }
    .MuiButton-root.Mui-disabled {
        opacity: 0.45;
    }
    .MuiButton-root:active {
        transform: scale(0.98);
    }
    @media (max-width: 360px) {
        padding: 16px;
        nav {
            gap: 6px;
        }
        .MuiButton-root {
            padding-inline: 10px;
        }
    }
    audio {
        display: block;
        width: 100%;
        margin: 10px 0;
    }
    details {
        margin-top: 12px;
        font-size: 12px;
    }
    summary {
        cursor: pointer;
    }
    pre {
        max-height: 160px;
        overflow: auto;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }
`;
