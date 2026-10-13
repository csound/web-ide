import { css, type Theme } from "@emotion/react";
import { headerHeight } from "@styles/constants";

export const readerStyle = (theme: Theme) => css`
    position: fixed;
    top: ${headerHeight}px;
    inset-inline: 0;
    bottom: 0;
    overflow-y: auto;
    background: ${theme.background};
    color: ${theme.textColor};
    font-family: ${theme.font.regular};
    * {
        box-sizing: border-box;
    }
    a {
        color: inherit;
        text-underline-offset: 0.2em;
    }
    button,
    input {
        font: inherit;
        color: inherit;
    }
    button {
        cursor: pointer;
        background: ${theme.buttonBackground};
        border: 1px solid ${theme.line};
        border-radius: 6px;
        padding: 8px 12px;
    }
    a:focus-visible,
    button:focus-visible,
    input:focus-visible,
    [tabindex="0"]:focus-visible {
        outline: 2px solid ${theme.textColor};
        outline-offset: 3px;
    }
    .doc-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }
    .doc-skip {
        position: absolute;
        top: 8px;
        left: 12px;
        padding: 12px;
        background: ${theme.background};
        transform: translateY(-200%);
        z-index: 1;
    }
    .doc-skip:focus {
        transform: none;
    }
    .doc-layout {
        display: grid;
        grid-template-columns: 240px minmax(0, 720px) 180px;
        gap: clamp(24px, 3vw, 48px);
        max-width: 1380px;
        margin: 0 auto;
        padding: 0 32px;
    }
    .doc-sidebar {
        position: sticky;
        top: 0;
        align-self: start;
        max-height: calc(100dvh - ${headerHeight}px);
        overflow-y: auto;
        padding: 32px 18px 32px 0;
        border-right: 1px solid ${theme.line};
        scrollbar-width: thin;
    }
    .doc-brand {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 26px;
    }
    .doc-brand > a {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 600;
        text-decoration: none;
    }
    .doc-menu {
        display: none;
    }
    .doc-search {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 9px 10px;
        margin-bottom: 28px;
        background: ${theme.buttonBackground};
        border: 1px solid ${theme.line};
        border-radius: 6px;
    }
    .doc-search input {
        width: 100%;
        min-width: 0;
        background: transparent;
        border: 0;
        font-size: 12px;
    }
    .doc-search input::placeholder {
        color: ${theme.altTextColor};
        opacity: 1;
    }
    .doc-label {
        display: block;
        font-size: 11px;
        line-height: 1.5;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 600;
        color: ${theme.altTextColor};
        margin: 0 0 10px;
    }
    .doc-contents section {
        margin-bottom: 24px;
    }
    .doc-contents nav a {
        display: block;
        padding: 7px 10px;
        border-radius: 5px;
        font-size: 12px;
        line-height: 1.6;
        text-decoration: none;
        margin: 1px 0;
    }
    .doc-contents nav a:hover {
        background: ${theme.buttonBackgroundHover};
    }
    .doc-contents nav a[aria-current="page"] {
        color: ${theme.textColor};
        background: ${theme.highlightBackgroundAlt};
        font-weight: 600;
        box-shadow: inset 2px 0 ${theme.tabHighlightActive};
    }
    .doc-contents p {
        font-size: 13px;
        line-height: 1.7;
    }
    .doc-clear {
        font-size: 12px;
    }
    .doc-contribute {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        margin-top: 28px;
        color: ${theme.altTextColor};
    }
    .doc-article {
        min-width: 0;
        padding: 55px 0 40px;
        outline: none;
        scroll-margin-top: 24px;
        font-size: 15px;
        line-height: 1.8;
        overflow-wrap: anywhere;
    }
    .doc-eyebrow {
        display: flex;
        align-items: center;
        gap: 12px;
        color: ${theme.altTextColor};
        font-size: 11px;
        margin-bottom: 18px;
    }
    .doc-article h1 {
        margin: 0 0 18px;
        font-size: clamp(30px, 3.4vw, 44px);
        font-weight: 600;
        letter-spacing: -0.045em;
        line-height: 1.15;
        color: ${theme.headerTextColor};
    }
    .doc-article h1 + p {
        font-size: 17px;
        line-height: 1.8;
        color: ${theme.altTextColor};
        margin-bottom: 38px;
        max-width: 55ch;
    }
    .doc-article h2 {
        margin: 38px 0 12px;
        padding-top: 8px;
        font-size: 22px;
        font-weight: 500;
        letter-spacing: -0.025em;
        line-height: 1.4;
        scroll-margin-top: 24px;
    }
    .doc-article h3 {
        margin: 28px 0 10px;
        font-size: 17px;
        font-weight: 600;
        scroll-margin-top: 24px;
    }
    .doc-article p {
        margin: 12px 0 18px;
    }
    .doc-article strong {
        font-weight: 600;
    }
    .doc-article a {
        text-decoration-color: ${theme.lineHover};
    }
    .doc-article a:hover {
        text-decoration-color: currentColor;
    }
    .doc-article :not(pre) > code {
        font-family: ${theme.font.monospace};
        font-size: 0.88em;
        background: ${theme.buttonBackground};
        padding: 2px 5px;
        border-radius: 4px;
    }
    .doc-code {
        position: relative;
        margin: 24px 0;
    }
    .doc-code pre {
        margin: 0;
        padding: 24px 48px 24px 20px;
        background: ${theme.buttonBackground};
        border: 1px solid ${theme.line};
        border-radius: 6px;
        overflow-x: auto;
        font-family: ${theme.font.monospace};
        font-size: 12px;
        line-height: 1.9;
    }
    .doc-code button {
        position: absolute;
        right: 8px;
        top: 8px;
        padding: 6px;
        border: 0;
        background: ${theme.buttonBackground};
        opacity: 0.75;
    }
    .doc-code button:hover,
    .doc-code button:focus-visible {
        opacity: 1;
    }
    .doc-table {
        overflow-x: auto;
        margin: 22px 0 26px;
        border: 1px solid ${theme.line};
        border-radius: 6px;
    }
    .doc-table table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        line-height: 1.7;
    }
    .doc-table th {
        font-weight: 600;
        background: ${theme.buttonBackground};
    }
    .doc-table th,
    .doc-table td {
        text-align: left;
        padding: 12px 16px;
        border-bottom: 1px solid ${theme.line};
        vertical-align: top;
        min-width: 100px;
    }
    .doc-table tr:last-child td {
        border-bottom: 0;
    }
    .doc-article blockquote {
        margin: 24px 0;
        border-left: 2px solid ${theme.tabHighlightActive};
        padding: 1px 20px;
        background: ${theme.buttonBackground};
    }
    .doc-article img {
        max-width: 100%;
        height: auto;
        border-radius: 6px;
    }
    .doc-outline {
        position: sticky;
        top: 40px;
        align-self: start;
        margin-top: 56px;
        max-height: calc(100dvh - ${headerHeight + 80}px);
        overflow-y: auto;
    }
    .doc-outline a {
        display: block;
        font-size: 11px;
        line-height: 1.7;
        padding: 7px 0;
        color: ${theme.altTextColor};
        text-decoration: none;
    }
    .doc-outline a:hover {
        color: ${theme.textColor};
        text-decoration: underline;
    }
    .doc-outline a.doc-subheading {
        padding-left: 12px;
    }
    .doc-inline-outline {
        display: none;
        margin: 24px 0;
        border-block: 1px solid ${theme.line};
        padding: 12px 0;
        font-size: 12px;
    }
    .doc-inline-outline summary {
        cursor: pointer;
        font-weight: 600;
    }
    .doc-inline-outline a {
        display: block;
        padding: 8px 0;
    }
    .doc-inline-outline summary:focus-visible {
        outline: 2px solid ${theme.textColor};
        outline-offset: 3px;
    }
    .doc-footer {
        margin-top: 48px;
        padding-top: 24px;
        border-top: 1px solid ${theme.line};
    }
    .doc-edit {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: ${theme.altTextColor};
    }
    .doc-pagination {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-top: 30px;
    }
    .doc-pagination a {
        text-decoration: none;
        font-size: 14px;
        position: relative;
    }
    .doc-pagination a:last-child {
        text-align: right;
    }
    .doc-pagination a svg {
        vertical-align: middle;
        margin-left: 8px;
    }
    .doc-pagination small {
        display: block;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: ${theme.altTextColor};
        margin-bottom: 6px;
    }
    @media (max-width: 1150px) {
        .doc-layout {
            grid-template-columns: 220px minmax(0, 1fr);
            max-width: 1100px;
        }
        .doc-outline {
            display: none;
        }
        .doc-inline-outline {
            display: block;
        }
    }
    @media (max-width: 760px) {
        .doc-layout {
            display: block;
            padding: 0 20px;
        }
        .doc-sidebar {
            position: static;
            max-height: none;
            padding: 20px 0;
            border-right: 0;
            border-bottom: 1px solid ${theme.line};
        }
        .doc-brand {
            margin-bottom: 0;
        }
        .doc-menu {
            display: block;
            font-size: 11px;
        }
        .doc-contents {
            display: none;
            margin-top: 24px;
        }
        .is-expanded .doc-contents {
            display: block;
        }
        .doc-article {
            padding-top: 32px;
        }
        .doc-eyebrow {
            font-size: 10px;
        }
        .doc-article h1 + p {
            font-size: 16px;
        }
        .doc-code pre {
            font-size: 11px;
        }
    }
    @media (prefers-reduced-motion: no-preference) {
        .doc-contents a,
        .doc-code button {
            transition:
                background-color 120ms ease,
                opacity 120ms ease;
        }
    }
`;
