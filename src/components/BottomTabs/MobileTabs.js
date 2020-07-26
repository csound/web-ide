import React, { useState } from "react";
import FileTree from "@comp/FileTree";
import Console from "@comp/Console/Console";
import MobileNavigation from "@comp/ProjectEditor/MobileNavigation";
import CsoundManualWindow from "@comp/ProjectEditor/CsoundManual";
import { DnDProvider } from "@comp/FileTree/context";
import * as SS from "./styles";

const MobileTabs = ({ activeProject, csound, tabDock, projectUid }) => {
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
            <CsoundManualWindow manualDrag={false} projectUid={projectUid} />
        </div>
    );

    return (
        <DnDProvider project={activeProject}>
            <style>
                {`body {overflow: hidden!important;}` +
                    `#drag-tab-list {display: none;}`}
            </style>
            {MobileConsole}
            {mobileTabIndex === 0
                ? tabDock
                : mobileTabIndex === 1
                ? MobileFileTree
                : mobileTabIndex === 3
                ? MobileManual
                : null}
            <MobileNavigation
                mobileTabIndex={mobileTabIndex}
                setMobileTabIndex={setMobileTabIndex}
            />
        </DnDProvider>
    );
};

export default MobileTabs;
