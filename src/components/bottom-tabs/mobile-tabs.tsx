import React, { useState } from "react";
import FileTree from "@comp/file-tree";
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

    const MobileFileTree = (
        <div css={SS.mobileFileTree}>
            <FileTree />
        </div>
    );

    const MobileConsole = (
        <div
            css={SS.mobileConsole}
            style={{
                display: mobileTabIndex === 2 ? "inherit" : "none"
            }}
        >
            <Console />
        </div>
    );

    const MobileManual = (
        <div css={SS.mobileManual}>
            <CsoundManualWindow projectUid={projectUid} />
        </div>
    );

    return (
        <DnDProvider project={activeProject}>
            <>
                <style>
                    {`body {overflow: hidden!important;}` +
                        `#drag-tab-list {display: none;}
                         .cm-editor {  zoom: 120%; }
                         .cm-theme {
                           overflow-y: scroll;
                           top: 68px;
                           height: calc(100vh - 68px - 56px)!important;
                           position: absolute;
                           left: 0;
                           right: 0;
                          bottom: 56px;}`}
                </style>
                {MobileConsole}
                {mobileTabIndex === 0
                    ? currentDocument && (
                          <EditorForDocument
                              uid={projectUid}
                              projectUid={projectUid}
                              doc={currentDocument}
                              isOwner={false}
                          />
                      )
                    : mobileTabIndex === 1
                      ? MobileFileTree
                      : mobileTabIndex === 3
                        ? MobileManual
                        : undefined}
                <MobileNavigation
                    mobileTabIndex={mobileTabIndex}
                    setMobileTabIndex={setMobileTabIndex}
                />
            </>
        </DnDProvider>
    );
};

export default MobileTabs;
