import React, { useEffect, useState } from "react";
import { FileTree } from "@comp/file-tree";
import Console from "@comp/console/console";
import MobileNavigation from "@comp/project-editor/mobile-navigation";
import CsoundManualWindow from "@comp/project-editor/csound-manual";
import { EditorForDocument } from "@comp/project-editor/project-editor";
import { IOpenDocument } from "@comp/project-editor/types";
import { DnDProvider } from "@comp/file-tree/context";
import { IDocument, IProject } from "@comp/projects/types";
import {
    MarkdownModeToggle,
    type MarkdownMode
} from "@comp/editor/markdown-mode-toggle";
import * as SS from "./styles";
import { useReadlineRequest } from "@comp/console/readline";

const SampleEditor = React.lazy(() =>
    import("@comp/audio-tools/project-tools").then((module) => ({
        default: module.SampleEditor
    }))
);
const AudioAnalysis = React.lazy(() =>
    import("@comp/audio-tools/project-tools").then((module) => ({
        default: module.AudioAnalysis
    }))
);

const MobileTabs = ({
    activeProject,
    projectUid,
    currentDocument
}: {
    activeProject: IProject;
    projectUid: string;
    currentDocument: IDocument | IOpenDocument | undefined;
}): React.ReactElement => {
    const [mobileTabIndex, setMobileTabIndex] = useState(0);
    const temporaryUid = (currentDocument as IOpenDocument | undefined)
        ?.temporary
        ? (currentDocument as IOpenDocument).uid
        : undefined;
    useEffect(() => {
        if (temporaryUid) setMobileTabIndex(0);
    }, [temporaryUid]);
    const readlineRequest = useReadlineRequest();
    useEffect(() => {
        if (readlineRequest?.projectUid === projectUid) setMobileTabIndex(2);
    }, [readlineRequest, projectUid]);
    const [markdownModes, setMarkdownModes] = useState<
        Record<string, MarkdownMode>
    >({});
    const documentKey =
        (currentDocument as IDocument | undefined)?.documentUid ?? "";
    const documentName =
        currentDocument &&
        ("filename" in currentDocument
            ? currentDocument.filename
            : currentDocument.temporary?.filename || currentDocument.uid);
    const isMarkdown = /\.(md|markdown)$/i.test(
        (currentDocument as IDocument | undefined)?.filename ?? ""
    );

    const mobileFileTree = (
        <div css={SS.mobileFileTree}>
            <FileTree
                activeProjectUid={projectUid}
                onOpenDocument={() => setMobileTabIndex(0)}
            />
        </div>
    );

    const mobileConsole = (
        <div css={SS.mobileConsole}>
            <Console projectUid={projectUid} />
        </div>
    );

    const mobileManual = (
        <div css={SS.mobileManual}>
            <CsoundManualWindow projectUid={projectUid} showHeader={false} />
        </div>
    );

    return (
        <DnDProvider project={activeProject}>
            <div css={SS.mobileLayout}>
                {mobileTabIndex === 0 && currentDocument && (
                    <div css={SS.mobileDocumentBar}>
                        <span title={documentName}>{documentName}</span>
                        {isMarkdown ? (
                            <MarkdownModeToggle
                                mode={markdownModes[documentKey] ?? "preview"}
                                onChange={(mode) =>
                                    setMarkdownModes((modes) => ({
                                        ...modes,
                                        [documentKey]: mode
                                    }))
                                }
                            />
                        ) : undefined}
                    </div>
                )}
                <div css={SS.mobileContent}>
                    {mobileTabIndex === 0 ? (
                        <div css={SS.mobileEditor}>
                            {currentDocument && (
                                <EditorForDocument
                                    uid={activeProject.userUid}
                                    projectUid={projectUid}
                                    doc={currentDocument}
                                    isOwner={false}
                                    markdownMode={
                                        markdownModes[documentKey] ?? "preview"
                                    }
                                />
                            )}
                        </div>
                    ) : mobileTabIndex === 1 ? (
                        mobileFileTree
                    ) : mobileTabIndex === 2 ? (
                        mobileConsole
                    ) : mobileTabIndex === 3 ? (
                        mobileManual
                    ) : mobileTabIndex === 4 || mobileTabIndex === 5 ? (
                        <React.Suspense
                            fallback={<p role="status">Opening audio tools…</p>}
                        >
                            {mobileTabIndex === 4 ? (
                                <SampleEditor projectUid={projectUid} />
                            ) : (
                                <AudioAnalysis projectUid={projectUid} />
                            )}
                        </React.Suspense>
                    ) : undefined}
                </div>
                <MobileNavigation
                    mobileTabIndex={mobileTabIndex}
                    setMobileTabIndex={setMobileTabIndex}
                />
            </div>
        </DnDProvider>
    );
};

export default MobileTabs;
