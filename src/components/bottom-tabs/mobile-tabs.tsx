import React, { useState } from "react";
import { FileTree } from "@comp/file-tree";
import Console from "@comp/console/console";
import MobileNavigation from "@comp/project-editor/mobile-navigation";
import CsoundManualWindow from "@comp/project-editor/csound-manual";
import { EditorForDocument } from "@comp/project-editor/project-editor";
import { IOpenDocument } from "@comp/project-editor/types";
import { DnDProvider } from "@comp/file-tree/context";
import { IDocument, IProject } from "@comp/projects/types";
import * as SS from "./styles";

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

    const mobileFileTree = (
        <div css={SS.mobileFileTree}>
            <FileTree activeProjectUid={projectUid} />
        </div>
    );

    const mobileConsole = (
        <div css={SS.mobileConsole}>
            <Console />
        </div>
    );

    const mobileManual = (
        <div css={SS.mobileManual}>
            <CsoundManualWindow projectUid={projectUid} />
        </div>
    );

    return (
        <DnDProvider project={activeProject}>
            <div css={SS.mobileLayout}>
                <div css={SS.mobileContent}>
                    {mobileTabIndex === 0 ? (
                        <div css={SS.mobileEditor}>
                            {currentDocument && (
                                <EditorForDocument
                                    uid={projectUid}
                                    projectUid={projectUid}
                                    doc={currentDocument}
                                    isOwner={false}
                                />
                            )}
                        </div>
                    ) : mobileTabIndex === 1 ? (
                        mobileFileTree
                    ) : mobileTabIndex === 2 ? (
                        mobileConsole
                    ) : mobileTabIndex === 3 ? (
                        mobileManual
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
