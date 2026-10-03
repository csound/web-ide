import { useState } from "react";
import Editor from "./editor";
import { MarkdownPreview } from "./markdown-preview";

export default function TextEditor({
    documentUid,
    projectUid,
    filename
}: {
    documentUid: string;
    projectUid: string;
    filename: string;
}) {
    const [showPreview, setShowPreview] = useState(false);
    const isMarkdown = /\.(md|markdown)$/i.test(filename);
    const previewVisible = isMarkdown && showPreview;

    return (
        <div
            css={{
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column"
            }}
        >
            {isMarkdown && (
                <div
                    css={(theme) => ({
                        display: "flex",
                        justifyContent: "flex-end",
                        padding: 4,
                        borderBottom: `1px solid ${theme.line}`,
                        background: theme.gutterBackground
                    })}
                >
                    <button
                        type="button"
                        onClick={() => setShowPreview((preview) => !preview)}
                        aria-label={
                            previewVisible
                                ? "Edit Markdown"
                                : "Preview Markdown"
                        }
                        css={(theme) => ({
                            minHeight: 32,
                            padding: "4px 12px",
                            border: `1px solid ${theme.line}`,
                            borderRadius: 4,
                            background: theme.background,
                            color: theme.textColor,
                            cursor: "pointer"
                        })}
                    >
                        {previewVisible ? "Edit" : "Preview"}
                    </button>
                </div>
            )}
            <div hidden={previewVisible} css={{ flex: 1, minHeight: 0 }}>
                <Editor documentUid={documentUid} projectUid={projectUid} />
            </div>
            {previewVisible && (
                <div css={{ flex: 1, minHeight: 0 }}>
                    <MarkdownPreview
                        documentUid={documentUid}
                        projectUid={projectUid}
                    />
                </div>
            )}
        </div>
    );
}
