import { useSelector } from "@root/store";
import { css, useTheme, Theme, SerializedStyles } from "@emotion/react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { _scrollbars } from "@styles/_common";

const markdownComponents: Components = {
    table: ({ children }) => (
        <div
            className="markdown-table"
            role="region"
            aria-label="Markdown table"
            tabIndex={0}
        >
            <table>{children}</table>
        </div>
    )
};

const previewStyle = (theme: Theme): SerializedStyles => css`
    height: 100%;
    box-sizing: border-box;
    overflow-y: auto;
    padding: 24px 32px;
    background-color: ${theme.background};
    color: ${theme.textColor};
    font-family: ${theme.font.regular};
    font-size: 15px;
    line-height: 1.6;
    ${_scrollbars(theme)}

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        color: ${theme.headerTextColor};
        font-weight: 600;
        line-height: 1.25;
        margin-top: 24px;
        margin-bottom: 12px;
    }
    h1 {
        font-size: 2em;
        border-bottom: 1px solid ${theme.line};
        padding-bottom: 8px;
    }
    h2 {
        font-size: 1.5em;
        border-bottom: 1px solid ${theme.line};
        padding-bottom: 6px;
    }
    h3 {
        font-size: 1.25em;
    }
    h4 {
        font-size: 1em;
    }

    p {
        margin: 0 0 16px;
    }

    a {
        color: ${theme.keyword};
        text-decoration: none;
        &:hover {
            text-decoration: underline;
        }
    }

    code {
        font-family: ${theme.font.monospace};
        font-size: 0.875em;
        background: ${theme.highlightBackground};
        padding: 2px 5px;
        border-radius: 4px;
    }

    pre {
        background: ${theme.highlightBackground};
        border: 1px solid ${theme.line};
        border-radius: 6px;
        padding: 16px;
        overflow-x: auto;
        margin: 0 0 16px;
        ${_scrollbars(theme)}

        code {
            background: none;
            padding: 0;
            font-size: 0.875em;
        }
    }

    blockquote {
        margin: 0 0 16px;
        padding: 0 16px;
        border-left: 4px solid ${theme.line};
        color: ${theme.altTextColor};
    }

    ul,
    ol {
        margin: 0 0 16px;
        padding-left: 24px;
    }

    li {
        margin-bottom: 4px;
    }

    hr {
        border: none;
        border-top: 1px solid ${theme.line};
        margin: 24px 0;
    }

    img {
        max-width: 100%;
    }

    .markdown-table {
        overflow-x: auto;
        margin: 0 0 16px;
        ${_scrollbars(theme)}

        &:focus-visible {
            outline: 2px solid ${theme.keyword};
            outline-offset: -2px;
        }
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th,
    td {
        padding: 8px 12px;
        border: 1px solid ${theme.line};
        text-align: left;
        vertical-align: top;
    }

    th {
        background: ${theme.highlightBackground};
        color: ${theme.headerTextColor};
        font-weight: 600;
    }
`;

export function MarkdownPreview({
    documentUid,
    projectUid
}: {
    documentUid: string;
    projectUid: string;
}) {
    const theme = useTheme();
    const content = useSelector(
        (state) =>
            state.ProjectsReducer.projects[projectUid]?.documents?.[documentUid]
                ?.currentValue ?? ""
    );

    return (
        <div css={previewStyle(theme)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
