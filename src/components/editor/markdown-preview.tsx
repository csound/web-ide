import { useState } from "react";
import { useSelector } from "@root/store";
import { css, useTheme, Theme, SerializedStyles } from "@emotion/react";
import ReactMarkdown from "react-markdown";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { _scrollbars } from "@styles/_common";
import Editor from "./editor";

const containerStyle = css`
    height: 100%;
    display: flex;
    flex-direction: column;
`;

const toolbarStyle = (theme: Theme): SerializedStyles => css`
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 8px;
    height: 34px;
    background-color: ${theme.highlightBackgroundAlt};
    box-shadow: inset 0 -1px 0 ${theme.line};
`;

const toggleButtonStyle = (theme: Theme): SerializedStyles => css`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border: 1px solid ${theme.line};
    border-radius: 6px;
    background: ${theme.buttonBackground};
    color: ${theme.altTextColor};
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        color 0.15s ease;

    svg {
        font-size: 14px !important;
    }

    &:hover {
        background: ${theme.buttonBackgroundHover};
        color: ${theme.textColor};
    }
`;

const editorWrapperStyle = css`
    flex: 1 1 auto;
    min-height: 0;
`;

const previewStyle = (theme: Theme): SerializedStyles => css`
    flex: 1 1 auto;
    min-height: 0;
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

    table {
        border-collapse: collapse;
        width: 100%;
        margin: 0 0 16px;

        th,
        td {
            border: 1px solid ${theme.line};
            padding: 6px 12px;
        }

        th {
            background: ${theme.highlightBackground};
            font-weight: 600;
        }

        tr:nth-of-type(even) td {
            background: ${theme.highlightBackgroundAlt};
        }
    }

    img {
        max-width: 100%;
    }
`;

export function MarkdownEditor({
    documentUid,
    projectUid,
    showPreview: showPreviewProp,
    onTogglePreview
}: {
    documentUid: string;
    projectUid: string;
    showPreview?: boolean;
    onTogglePreview?: () => void;
}) {
    const [showPreviewInternal, setShowPreviewInternal] = useState(false);
    const isControlled = showPreviewProp !== undefined;
    const showPreview = isControlled ? showPreviewProp : showPreviewInternal;
    const theme = useTheme();

    const content = useSelector(
        (state: any) =>
            state?.ProjectsReducer?.projects?.[projectUid]?.documents?.[
                documentUid
            ]?.currentValue ?? ""
    );

    return (
        <div css={containerStyle}>
            {!isControlled && (
                <div css={toolbarStyle(theme)}>
                    <button
                        css={toggleButtonStyle(theme)}
                        onClick={() =>
                            setShowPreviewInternal((prev) => !prev)
                        }
                        title={
                            showPreview
                                ? "Switch to editor"
                                : "Preview rendered markdown"
                        }
                    >
                        {showPreview ? (
                            <EditRoundedIcon fontSize="inherit" />
                        ) : (
                            <VisibilityRoundedIcon fontSize="inherit" />
                        )}
                        {showPreview ? "Edit" : "Preview"}
                    </button>
                </div>
            )}
            {showPreview ? (
                <div css={previewStyle(theme)}>
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            ) : (
                <div css={editorWrapperStyle}>
                    <Editor
                        documentUid={documentUid}
                        projectUid={projectUid}
                    />
                </div>
            )}
        </div>
    );
}
