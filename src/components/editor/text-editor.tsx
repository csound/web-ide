import Editor from "./editor";
import { MarkdownPreview } from "./markdown-preview";
import type { MarkdownMode } from "./markdown-mode-toggle";

export default function TextEditor({
    documentUid,
    projectUid,
    filename,
    mode = "preview"
}: {
    documentUid: string;
    projectUid: string;
    filename: string;
    mode?: MarkdownMode;
}) {
    const isMarkdown = /\.(md|markdown)$/i.test(filename);
    const previewVisible = isMarkdown && mode === "preview";

    return (
        <>
            <div hidden={previewVisible} css={{ height: "100%", minHeight: 0 }}>
                <Editor documentUid={documentUid} projectUid={projectUid} />
            </div>
            {previewVisible && (
                <MarkdownPreview
                    documentUid={documentUid}
                    projectUid={projectUid}
                />
            )}
        </>
    );
}
