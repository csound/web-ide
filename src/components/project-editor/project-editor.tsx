import { FilePlayButton } from "@comp/target-controls/file-play-button";
import { ProjectFileDrop } from "./project-file-drop";
import { useGuestReadme } from "./use-guest-readme";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import AccountTree from "@mui/icons-material/AccountTree";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import ArrowForward from "@mui/icons-material/ArrowForward";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import CloseIcon from "@mui/icons-material/Close";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import CropFreeIcon from "@mui/icons-material/CropFree";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import StackedLineChartIcon from "@mui/icons-material/StackedLineChart";
import HorizontalSplitIcon from "@mui/icons-material/HorizontalSplit";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import VerticalSplitIcon from "@mui/icons-material/VerticalSplit";
import { selectCurrentTab, selectIsOwner } from "./selectors";
import { DnDProvider } from "@comp/file-tree/context";
import { NonCloudFile } from "@comp/file-tree/types";
import { IDocument, IProject } from "@comp/projects/types";
import {
    Tabs,
    DragTabList,
    DragTab,
    PanelList,
    Panel as TabPanel
} from "@root/tabtab/index.js";
import { arrayMoveImmutable as simpleSwitch } from "array-move";
import { subscribeToProjectLastModified } from "@comp/project-last-modified/subscribers";
import {
    subscribeToProfile,
    subscribeToProjectsCount
} from "@comp/profile/subscribers";
import tabStyles, { tabListStyle } from "./tab-styles";
import { isAudioFile } from "../projects/utils";
import { newFolder } from "@comp/projects/actions";
import { Beforeunload } from "react-beforeunload";
import {
    IOpenDocument,
    IWorkspaceLayoutNode,
    IWorkspacePanelNode,
    IWorkspaceTab,
    SidebarPosition,
    WorkspaceTabType
} from "./types";
import { IProjectEditorReducer } from "./reducer";
import TextEditor from "../editor/text-editor";
import {
    MarkdownModeToggle,
    type MarkdownMode
} from "../editor/markdown-mode-toggle";
import { AudioEditor } from "../audio-editor/audio-editor";
import { subscribeToProjectChanges } from "@comp/projects/subscribers";
import CsoundManualWindow from "./csound-manual";
import { FileTree } from "../file-tree";
import {
    storeEditorKeyboardCallbacks,
    storeProjectEditorKeyboardCallbacks
} from "@comp/hot-keys/actions";
import { find, isEmpty } from "lodash";
import {
    closePanel,
    closePanelTab,
    closeSidebarTab,
    movePanel,
    openSidebarTab,
    reorderPanelTabs,
    setActivePanel,
    setManualPanelOpen,
    setSidebarTabIndex,
    splitActivePanel,
    switchPanelTab,
    tabClose,
    toggleMaximizePanel,
    WORKSPACE_DEFAULT_CONSOLE_DISMISSED_STORAGE_KEY
} from "./actions";
import { isMobile } from "@root/utils";
import * as SS from "./styles";
import MobileTabs from "@comp/bottom-tabs/mobile-tabs";
import { useSetConsole } from "@comp/console/context";
import Console from "@comp/console/console";
import { useReadlineRequest } from "@comp/console/readline";
import { revealConsole } from "./actions";
import {
    Panel as ResizablePanel,
    PanelGroup,
    PanelResizeHandle,
    type ImperativePanelHandle
} from "react-resizable-panels";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { WebMcpLink } from "@root/webmcp/provider";
import { TemporaryEditor } from "./temporary-editor";
import {
    persistentWorkspace,
    temporaryDocumentUids
} from "./temporary-documents";
import { retainTemporaryPlayback } from "./temporary-playback";
import { stopProjectPlayback } from "@comp/target-controls/playback";
import { stopPerformance } from "@comp/csound/actions";

import { ToolOverflow } from "./tool-overflow";
import WavesRounded from "@mui/icons-material/WavesRounded";
import FilterAltRounded from "@mui/icons-material/FilterAltRounded";
import TransformRounded from "@mui/icons-material/TransformRounded";
import GraphicEqRounded from "@mui/icons-material/GraphicEqRounded";
import DataArrayRounded from "@mui/icons-material/DataArrayRounded";
import MultilineChartRounded from "@mui/icons-material/MultilineChartRounded";
import TuneRounded from "@mui/icons-material/TuneRounded";
import QueueMusicRounded from "@mui/icons-material/QueueMusicRounded";

const TabStyles = tabStyles(false);

type AnyTab = IDocument | IOpenDocument | NonCloudFile;

type IEditorForDocumentProperties = {
    uid: any;
    doc: AnyTab;
    projectUid: string;
    isOwner: boolean;
    markdownMode?: MarkdownMode;
};

const utilityTabDefinitions: Record<
    Exclude<WorkspaceTabType, "editor" | "fileTree" | "manual">,
    {
        title: string;
        component: React.ComponentType<any>;
    }
> = {
    sdifConverter: {
        title: "SDIF Converter",
        component: React.lazy(() => import("@comp/sdif-tools/project-sdif"))
    },
    lpcEditor: {
        title: "LPC Editor",
        component: React.lazy(() => import("@comp/lpc-tools/project-lpc"))
    },
    pvxEditor: {
        title: "PVX Editor",
        component: React.lazy(() => import("@comp/pvx-tools/project-pvx"))
    },
    hetroEditor: {
        title: "HETRO Editor",
        component: React.lazy(() => import("@comp/hetro-tools/project-hetro"))
    },
    mixer: {
        title: "Mixer",
        component: React.lazy(() =>
            import("@comp/audio-tools/project-tools").then((module) => ({
                default: module.AudioMixer
            }))
        )
    },
    scoreTools: {
        title: "Score Converter",
        component: React.lazy(() => import("@comp/score-tools/score-tool"))
    },
    impulseResponse: {
        title: "Impulse Response",
        component: React.lazy(() =>
            import("@comp/audio-tools/project-tools").then((module) => ({
                default: module.ImpulseResponse
            }))
        )
    },
    convolutionPrep: {
        title: "Convolution Prep",
        component: React.lazy(() =>
            import("@comp/audio-tools/project-tools").then((module) => ({
                default: module.ConvolutionPrep
            }))
        )
    },
    sampleEditor: {
        title: "Sample Editor",
        component: React.lazy(() =>
            import("@comp/audio-tools/project-tools").then((module) => ({
                default: module.SampleEditor
            }))
        )
    },
    audioAnalysis: {
        title: "Audio Analysis",
        component: React.lazy(() =>
            import("@comp/audio-tools/project-tools").then((module) => ({
                default: module.AudioAnalysis
            }))
        )
    },
    console: {
        title: "Console",
        component: Console
    },
    spectralAnalyzer: {
        title: "Spectral Analyzer",
        component: React.lazy(
            () => import("@comp/spectral-analyzer/spectral-analyzer")
        )
    },
    piano: {
        title: "Virtual Midi Keyboard",
        component: React.lazy(() => import("@elem/midi-piano"))
    }
};

const specialistLaunchers: LauncherItem[] = [
    { type: "mixer", label: "Mixer", Icon: TuneRounded },
    { type: "impulseResponse", label: "Impulse Response", Icon: WavesRounded },
    {
        type: "convolutionPrep",
        label: "Convolution Prep",
        Icon: FilterAltRounded
    },
    { type: "scoreTools", label: "Score Converter", Icon: QueueMusicRounded },
    { type: "sdifConverter", label: "SDIF Converter", Icon: TransformRounded },
    { type: "lpcEditor", label: "LPC Editor", Icon: GraphicEqRounded },
    { type: "pvxEditor", label: "PVX Editor", Icon: DataArrayRounded },
    { type: "hetroEditor", label: "HETRO Editor", Icon: MultilineChartRounded }
];

type LauncherItem = {
    type: Exclude<WorkspaceTabType, "editor">;
    label: string;
    Icon: React.ElementType;
};

const sidebarChoices: Record<SidebarPosition, LauncherItem[]> = {
    left: [
        { type: "fileTree", label: "File Tree", Icon: AccountTree },
        {
            type: "manual",
            label: "Csound Manual",
            Icon: AutoStoriesRoundedIcon
        },
        { type: "console", label: "Console", Icon: ListAltRoundedIcon },
        {
            type: "spectralAnalyzer",
            label: "Spectral Analyzer",
            Icon: GraphicEqIcon
        },
        { type: "sampleEditor", label: "Sample Editor", Icon: ContentCutIcon },
        {
            type: "audioAnalysis",
            label: "Audio Analysis",
            Icon: StackedLineChartIcon
        },
        {
            type: "piano",
            label: "Virtual Midi Keyboard",
            Icon: MusicNoteIcon
        },
        ...specialistLaunchers
    ],
    right: [
        {
            type: "manual",
            label: "Csound Manual",
            Icon: AutoStoriesRoundedIcon
        },
        { type: "fileTree", label: "File Tree", Icon: AccountTree },
        { type: "console", label: "Console", Icon: ListAltRoundedIcon },
        {
            type: "spectralAnalyzer",
            label: "Spectral Analyzer",
            Icon: GraphicEqIcon
        },
        { type: "sampleEditor", label: "Sample Editor", Icon: ContentCutIcon },
        {
            type: "audioAnalysis",
            label: "Audio Analysis",
            Icon: StackedLineChartIcon
        },
        {
            type: "piano",
            label: "Virtual Midi Keyboard",
            Icon: MusicNoteIcon
        },
        ...specialistLaunchers
    ],
    // Keep the main tools first; specialist tools belong at the tail and overflow into More.
    bottom: [
        { type: "console", label: "Console", Icon: ListAltRoundedIcon },
        {
            type: "manual",
            label: "Csound Manual",
            Icon: AutoStoriesRoundedIcon
        },
        {
            type: "piano",
            label: "Virtual Midi Keyboard",
            Icon: MusicNoteIcon
        },
        {
            type: "spectralAnalyzer",
            label: "Spectral Analyzer",
            Icon: GraphicEqIcon
        },
        { type: "sampleEditor", label: "Sample Editor", Icon: ContentCutIcon },
        {
            type: "audioAnalysis",
            label: "Audio Analysis",
            Icon: StackedLineChartIcon
        },
        ...specialistLaunchers
    ]
};

export function EditorForDocument({
    uid,
    projectUid,
    doc,
    markdownMode
}: IEditorForDocumentProperties) {
    const compact = useMediaQuery("(max-width:900px)") || isMobile();
    if ((doc as IOpenDocument).temporary) {
        return (
            <TemporaryEditor
                tab={doc as IOpenDocument}
                projectUid={projectUid}
            />
        );
    } else if ((doc as IDocument).type === "txt") {
        return (
            <div
                css={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0
                }}
            >
                {compact && (
                    <FilePlayButton
                        projectUid={projectUid}
                        documentUid={(doc as IDocument).documentUid}
                        compact={false}
                    />
                )}
                <div css={{ flex: 1, minHeight: 0 }}>
                    <TextEditor
                        key={`${projectUid}:${(doc as IDocument).documentUid}`}
                        documentUid={(doc as IDocument).documentUid}
                        projectUid={projectUid}
                        filename={(doc as IDocument).filename || ""}
                        mode={markdownMode}
                    />
                </div>
            </div>
        );
    } else if (
        (doc as IDocument).type === "bin" &&
        isAudioFile((doc as IDocument).filename)
    ) {
        const path = `${uid}/${projectUid}/${(doc as IDocument).documentUid}`;
        return (
            <AudioEditor
                audioFileUrl={path}
                filename={(doc as IDocument).filename}
                projectUid={projectUid}
            />
        );
    } else if (
        (doc as IOpenDocument).isNonCloudDocument &&
        (doc as IOpenDocument).nonCloudFileAudioUrl
    ) {
        return (
            <AudioEditor
                filename={(doc as IOpenDocument).uid}
                projectUid={projectUid}
                audioFileUrl={
                    (doc as IOpenDocument).nonCloudFileAudioUrl as string
                }
            />
        );
    }

    return (
        <div>
            <p>Unknown document type</p>
        </div>
    );
}

const collectEditorTabs = (node: IWorkspaceLayoutNode): IWorkspaceTab[] => {
    if (node.kind === "panel") {
        return node.tabs.filter((tab) => tab.type === "editor");
    }

    return [
        ...collectEditorTabs(node.first),
        ...collectEditorTabs(node.second)
    ];
};

const countWorkspacePanels = (node: IWorkspaceLayoutNode): number => {
    if (node.kind === "panel") {
        return 1;
    }

    return countWorkspacePanels(node.first) + countWorkspacePanels(node.second);
};

const findPanelInTree = (
    node: IWorkspaceLayoutNode,
    panelId: string
): IWorkspacePanelNode | undefined => {
    if (node.kind === "panel") {
        return node.id === panelId ? node : undefined;
    }

    return (
        findPanelInTree(node.first, panelId) ||
        findPanelInTree(node.second, panelId)
    );
};

const getDocumentForTab = (
    tab: IWorkspaceTab,
    activeProject: IProject
): AnyTab | undefined => {
    if (tab.type !== "editor") {
        return undefined;
    }

    if (tab.isNonCloudDocument || tab.temporary) {
        return tab;
    }

    return activeProject.documents[tab.uid];
};

const getWorkspaceTabTitle = (
    tab: IWorkspaceTab,
    activeProject: IProject,
    isOwner: boolean
): string => {
    if (tab.type === "fileTree") {
        return activeProject.name
            ? `File Tree - ${activeProject.name}`
            : "File Tree";
    }

    if (tab.type === "manual") {
        return "Csound Manual";
    }

    if (tab.type !== "editor") {
        return utilityTabDefinitions[tab.type].title;
    }

    const document = getDocumentForTab(tab, activeProject);
    const label =
        tab.temporary?.filename ||
        (document as IDocument | undefined)?.filename ||
        (document as NonCloudFile | undefined)?.name ||
        tab.uid;
    const isModified = Boolean(
        (document as IDocument | undefined)?.isModifiedLocally
    );

    return label + (isOwner && isModified ? "*" : "");
};

const renderWorkspaceTabContent = ({
    tab,
    activeProject,
    projectUid,
    projectUserUid,
    isOwner,
    isDragging,
    markdownMode
}: {
    tab: IWorkspaceTab;
    activeProject: IProject;
    projectUid: string;
    projectUserUid: string;
    isOwner: boolean;
    isDragging: boolean;
    markdownMode?: MarkdownMode;
}) => {
    if (tab.type === "editor") {
        const document = getDocumentForTab(tab, activeProject);
        return document ? (
            <EditorForDocument
                uid={projectUserUid}
                projectUid={projectUid}
                isOwner={isOwner}
                doc={document}
                markdownMode={markdownMode}
            />
        ) : null;
    }

    if (tab.type === "fileTree") {
        return <FileTree activeProjectUid={projectUid} />;
    }

    if (tab.type === "manual") {
        return (
            <CsoundManualWindow
                projectUid={projectUid}
                isDragging={isDragging}
                showHeader={false}
            />
        );
    }

    const Component =
        utilityTabDefinitions[
            tab.type as Exclude<
                WorkspaceTabType,
                "editor" | "fileTree" | "manual"
            >
        ].component;

    return (
        <React.Suspense fallback={<></>}>
            <Component projectUid={projectUid} />
        </React.Suspense>
    );
};

const WorkspacePanelHeader = ({
    panel,
    activeProject,
    isOwner,
    actions,
    onTabChange,
    onCloseTab,
    handleTabChange,
    handleTabSequence,
    activeIndex = 0
}: {
    panel: IWorkspacePanelNode;
    activeProject: IProject;
    isOwner: boolean;
    actions?: React.ReactNode;
    onTabChange: (index: number) => void;
    onCloseTab: (tab: IWorkspaceTab) => void;
    handleTabChange?: (index: number) => void;
    handleTabSequence?: ({
        oldIndex,
        newIndex
    }: {
        oldIndex: number;
        newIndex: number;
    }) => void;
    activeIndex?: number;
}) => {
    const changeTab = handleTabChange || onTabChange;

    return (
        <div css={SS.panelTopBar}>
            <div css={SS.panelHeaderTabs}>
                <DragTabList
                    id={`workspace-panel-${panel.id}`}
                    handleTabSequence={handleTabSequence}
                    handleTabChange={changeTab}
                >
                    {panel.tabs.map((tab, index) => (
                        <DragTab
                            role="tab"
                            id={`workspace-tab-${tab.id}`}
                            closable={tab.type !== "fileTree"}
                            key={tab.id}
                            closeCallback={() => onCloseTab(tab)}
                            currentIndex={activeIndex}
                            thisIndex={index}
                            CustomTabStyle={TabStyles.Tab}
                            data-temporary={tab.temporary ? "true" : undefined}
                            title={
                                tab.temporary
                                    ? `${tab.temporary.filename} · Temporary, not saved to project`
                                    : undefined
                            }
                            handleTabChange={changeTab}
                            index={index}
                            active={index === activeIndex}
                        >
                            {tab.type === "editor" &&
                                !tab.temporary &&
                                !tab.isNonCloudDocument && (
                                    <FilePlayButton
                                        projectUid={activeProject.projectUid}
                                        documentUid={tab.uid}
                                    />
                                )}
                            <p style={{ margin: 0 }}>
                                {tab.temporary?.source?.kind ===
                                    "manual-example" && (
                                    <AutoStoriesRoundedIcon
                                        aria-hidden="true"
                                        css={{
                                            width: 14,
                                            height: 14,
                                            marginRight: 6,
                                            verticalAlign: "middle"
                                        }}
                                    />
                                )}
                                {getWorkspaceTabTitle(
                                    tab,
                                    activeProject,
                                    isOwner
                                )}
                            </p>
                        </DragTab>
                    ))}
                </DragTabList>
            </div>
            {actions && <div css={SS.panelActionGroup}>{actions}</div>}
        </div>
    );
};

const WorkspacePanelTabs = ({
    panel,
    activeProject,
    projectUserUid,
    isOwner,
    isActive,
    onTabChange,
    onTabSequenceChange,
    onCloseTab,
    renderTabContent,
    actions
}: {
    panel: IWorkspacePanelNode;
    activeProject: IProject;
    projectUserUid: string;
    isOwner: boolean;
    isActive: boolean;
    onTabChange: (index: number) => void;
    onTabSequenceChange?: (oldIndex: number, newIndex: number) => void;
    onCloseTab: (tab: IWorkspaceTab) => void;
    renderTabContent: (tab: IWorkspaceTab) => React.ReactNode;
    actions?: React.ReactNode;
}) => {
    if (isEmpty(panel.tabs)) {
        return <div style={{ position: "relative", height: "100%" }} />;
    }

    const safeIndex = Math.min(panel.tabIndex, panel.tabs.length - 1);

    return (
        <div css={SS.panelShell(isActive)}>
            <div css={tabListStyle} style={{ position: "relative" }}>
                <Tabs
                    defaultIndex={safeIndex}
                    activeIndex={safeIndex}
                    onTabChange={onTabChange}
                    customStyle={TabStyles}
                    showModalButton={false}
                    showArrowButton={false}
                    onTabSequenceChange={
                        onTabSequenceChange
                            ? ({
                                  oldIndex,
                                  newIndex
                              }: {
                                  oldIndex: number;
                                  newIndex: number;
                              }) => onTabSequenceChange(oldIndex, newIndex)
                            : undefined
                    }
                >
                    <WorkspacePanelHeader
                        panel={panel}
                        activeProject={activeProject}
                        isOwner={isOwner}
                        actions={actions}
                        onTabChange={onTabChange}
                        onCloseTab={onCloseTab}
                    />
                    <PanelList style={{ height: "100%", width: "100%" }}>
                        {panel.tabs.map((tab) => (
                            <TabPanel
                                key={`workspace-panel-${projectUserUid}-${tab.id}`}
                            >
                                {renderTabContent(tab)}
                            </TabPanel>
                        ))}
                    </PanelList>
                </Tabs>
            </div>
        </div>
    );
};

const SidebarPanelView = ({
    sidebar,
    position,
    activeProject,
    projectUid,
    projectUserUid,
    isOwner,
    isDragging
}: {
    sidebar: IWorkspacePanelNode;
    position: SidebarPosition;
    activeProject: IProject;
    projectUid: string;
    projectUserUid: string;
    isOwner: boolean;
    isDragging: boolean;
}) => {
    const dispatch = useDispatch();
    const activeTab =
        sidebar.tabs[Math.min(sidebar.tabIndex, sidebar.tabs.length - 1)];
    if (!activeTab) return null;
    const title = getWorkspaceTabTitle(activeTab, activeProject, isOwner);
    const closeLabel = `Close ${activeTab.type === "fileTree" ? "File Tree" : title}`;

    return (
        <section
            css={SS.panelShell(false)}
            aria-label={title}
            data-testid={`sidebar-${position}-panel`}
        >
            <header css={SS.panelTopBar}>
                <h2 css={SS.panelTopBarTitle} title={title}>
                    {title}
                </h2>
                <div css={SS.sectionHeaderActions}>
                    {activeTab.type === "fileTree" && isOwner && (
                        <Tooltip title="Create New Directory">
                            <button
                                type="button"
                                css={SS.panelActionButton}
                                onClick={() => dispatch(newFolder(projectUid))}
                                aria-label="Create new directory"
                            >
                                <CreateNewFolderIcon />
                            </button>
                        </Tooltip>
                    )}
                    <Tooltip title={closeLabel}>
                        <button
                            type="button"
                            css={SS.panelActionButton}
                            onClick={() => {
                                dispatch(
                                    closeSidebarTab(position, activeTab.id)
                                );
                                document
                                    .getElementById(
                                        `sidebar-${position}-${activeTab.type}`
                                    )
                                    ?.focus();
                            }}
                            aria-label={closeLabel}
                        >
                            <CloseIcon />
                        </button>
                    </Tooltip>
                </div>
            </header>
            <div css={SS.panelBody} key={activeTab.id}>
                {renderWorkspaceTabContent({
                    tab: activeTab,
                    activeProject,
                    projectUid,
                    projectUserUid,
                    isOwner,
                    isDragging
                })}
            </div>
        </section>
    );
};

const WorkspaceNodeView = ({
    node,
    activeProject,
    projectUid,
    projectUserUid,
    isOwner,
    activePanelId,
    isDragging,
    panelCount,
    markdownModes,
    setMarkdownMode
}: {
    node: IWorkspaceLayoutNode;
    activeProject: IProject;
    projectUid: string;
    projectUserUid: string;
    isOwner: boolean;
    activePanelId: string;
    isDragging: boolean;
    panelCount: number;
    markdownModes: Record<string, MarkdownMode>;
    setMarkdownMode: (tabId: string, mode: MarkdownMode) => void;
}) => {
    const dispatch = useDispatch();

    if (node.kind === "split") {
        return (
            <PanelGroup
                direction={
                    node.direction === "vertical" ? "horizontal" : "vertical"
                }
            >
                <ResizablePanel defaultSize={50}>
                    <WorkspaceNodeView
                        node={node.first}
                        activeProject={activeProject}
                        projectUid={projectUid}
                        projectUserUid={projectUserUid}
                        isOwner={isOwner}
                        activePanelId={activePanelId}
                        isDragging={isDragging}
                        panelCount={panelCount}
                        markdownModes={markdownModes}
                        setMarkdownMode={setMarkdownMode}
                    />
                </ResizablePanel>
                <PanelResizeHandle
                    className={`ProjectEditorResizer ${node.direction}`}
                />
                <ResizablePanel defaultSize={50}>
                    <WorkspaceNodeView
                        node={node.second}
                        activeProject={activeProject}
                        projectUid={projectUid}
                        projectUserUid={projectUserUid}
                        isOwner={isOwner}
                        activePanelId={activePanelId}
                        isDragging={isDragging}
                        panelCount={panelCount}
                        markdownModes={markdownModes}
                        setMarkdownMode={setMarkdownMode}
                    />
                </ResizablePanel>
            </PanelGroup>
        );
    }

    const panelTabIds = node.tabs.map((tab) => tab.id);
    const activeTab = node.tabs[Math.min(node.tabIndex, node.tabs.length - 1)];
    const activeDocument =
        activeTab && getDocumentForTab(activeTab, activeProject);
    const isMarkdown = /\.(md|markdown)$/i.test(
        (activeDocument as IDocument | undefined)?.filename ?? ""
    );

    return (
        <div
            css={SS.paneFrame}
            onMouseDown={() => dispatch(setActivePanel(node.id))}
        >
            <WorkspacePanelTabs
                panel={node}
                activeProject={activeProject}
                projectUserUid={projectUserUid}
                isOwner={isOwner}
                isActive={node.id === activePanelId}
                onTabChange={(index) =>
                    dispatch(switchPanelTab(node.id, index))
                }
                onTabSequenceChange={(oldIndex, newIndex) =>
                    dispatch(
                        reorderPanelTabs(
                            node.id,
                            simpleSwitch(panelTabIds, oldIndex, newIndex),
                            newIndex
                        )
                    )
                }
                onCloseTab={(tab) => {
                    if (tab.type === "editor") {
                        const document = getDocumentForTab(tab, activeProject);
                        dispatch(
                            tabClose(
                                projectUid,
                                tab.uid,
                                Boolean(
                                    (document as IDocument | undefined)
                                        ?.isModifiedLocally
                                ),
                                node.id,
                                tab.id
                            )
                        );
                        return;
                    }

                    dispatch(closePanelTab(node.id, tab.id));
                }}
                renderTabContent={(tab) =>
                    renderWorkspaceTabContent({
                        tab,
                        activeProject,
                        projectUid,
                        projectUserUid,
                        isOwner,
                        isDragging,
                        markdownMode: markdownModes[tab.id] ?? "preview"
                    })
                }
                actions={
                    <>
                        {isMarkdown && activeTab && (
                            <MarkdownModeToggle
                                mode={markdownModes[activeTab.id] ?? "preview"}
                                onChange={(mode) =>
                                    setMarkdownMode(activeTab.id, mode)
                                }
                            />
                        )}
                        {activeTab?.type === "fileTree" && isOwner && (
                            <Tooltip title="Create New Directory">
                                <button
                                    type="button"
                                    css={SS.panelActionButton}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        dispatch(newFolder(projectUid));
                                    }}
                                    aria-label="Create new directory"
                                >
                                    <CreateNewFolderIcon />
                                </button>
                            </Tooltip>
                        )}
                        <Tooltip title="Split Right">
                            <button
                                type="button"
                                css={SS.panelActionButton}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    dispatch(setActivePanel(node.id));
                                    dispatch(splitActivePanel("right"));
                                }}
                                aria-label="Split editor right"
                            >
                                <VerticalSplitIcon />
                            </button>
                        </Tooltip>
                        <Tooltip title="Split Down">
                            <button
                                type="button"
                                css={SS.panelActionButton}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    dispatch(setActivePanel(node.id));
                                    dispatch(splitActivePanel("bottom"));
                                }}
                                aria-label="Split editor down"
                            >
                                <HorizontalSplitIcon />
                            </button>
                        </Tooltip>
                        <Tooltip title="Toggle Focus Mode">
                            <button
                                type="button"
                                css={SS.panelActionButton}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    dispatch(toggleMaximizePanel(node.id));
                                }}
                                aria-label="Toggle focus mode"
                            >
                                <CropFreeIcon />
                            </button>
                        </Tooltip>
                        {panelCount > 1 && (
                            <>
                                <Tooltip title="Move Panel Left">
                                    <button
                                        type="button"
                                        css={SS.panelActionButton}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            dispatch(
                                                movePanel(node.id, "left")
                                            );
                                        }}
                                        aria-label="Move panel left"
                                    >
                                        <ArrowBack />
                                    </button>
                                </Tooltip>
                                <Tooltip title="Move Panel Right">
                                    <button
                                        type="button"
                                        css={SS.panelActionButton}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            dispatch(
                                                movePanel(node.id, "right")
                                            );
                                        }}
                                        aria-label="Move panel right"
                                    >
                                        <ArrowForward />
                                    </button>
                                </Tooltip>
                                <Tooltip title="Move Panel Bottom">
                                    <button
                                        type="button"
                                        css={SS.panelActionButton}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            dispatch(
                                                movePanel(node.id, "bottom")
                                            );
                                        }}
                                        aria-label="Move panel bottom"
                                    >
                                        <ArrowDownward />
                                    </button>
                                </Tooltip>
                            </>
                        )}
                        {panelCount > 1 && (
                            <Tooltip title="Close Panel">
                                <button
                                    type="button"
                                    css={SS.panelActionButton}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        dispatch(closePanel(node.id));
                                    }}
                                    aria-label="Close panel"
                                >
                                    <CloseIcon />
                                </button>
                            </Tooltip>
                        )}
                    </>
                }
            />
        </div>
    );
};

/** Show workspace tool launchers and open or focus the selected sidebar tab. */
const SidebarLaunchers = ({
    maximized,
    leftSidebar,
    rightSidebar,
    bottomSidebar
}: {
    maximized: boolean;
    leftSidebar: IWorkspacePanelNode | null;
    rightSidebar: IWorkspacePanelNode | null;
    bottomSidebar: IWorkspacePanelNode | null;
}) => {
    const dispatch = useDispatch();

    if (maximized) {
        return (
            <footer css={SS.bottomRail} aria-label="Editor footer">
                <WebMcpLink />
            </footer>
        );
    }

    const sidebars: Record<SidebarPosition, IWorkspacePanelNode | null> = {
        left: leftSidebar,
        right: rightSidebar,
        bottom: bottomSidebar
    };

    const handleLauncherClick = (
        sidebar: SidebarPosition,
        tabType: Exclude<WorkspaceTabType, "editor">
    ) => {
        const currentSidebar = sidebars[sidebar];
        const tabIndex =
            currentSidebar?.tabs.findIndex((tab) => tab.type === tabType) ?? -1;

        if (tabIndex > -1 && currentSidebar) {
            const tab = currentSidebar.tabs[tabIndex];

            if (currentSidebar.tabIndex === tabIndex) {
                dispatch(closeSidebarTab(sidebar, tab.id));
                return;
            }

            dispatch(setSidebarTabIndex(sidebar, tabIndex));
            return;
        }

        dispatch(openSidebarTab(sidebar, tabType));
    };

    const renderRailButton = (
        sidebar: SidebarPosition,
        item: LauncherItem,
        compact: boolean
    ) => {
        const currentSidebar = sidebars[sidebar];
        const tabIndex =
            currentSidebar?.tabs.findIndex((tab) => tab.type === item.type) ??
            -1;
        const isActive = Boolean(
            currentSidebar &&
                tabIndex > -1 &&
                currentSidebar.tabIndex === tabIndex
        );
        const Icon = item.Icon;

        return (
            <Tooltip
                key={`${sidebar}-${item.type}`}
                title={item.label}
                disableInteractive
            >
                <button
                    type="button"
                    id={`sidebar-${sidebar}-${item.type}`}
                    css={SS.activityButton({ active: isActive, compact })}
                    onClick={() => handleLauncherClick(sidebar, item.type)}
                    aria-label={item.label}
                    aria-pressed={isActive}
                    data-testid={`sidebar-${sidebar}-${item.type}`}
                >
                    <Icon fontSize="small" />
                    <span>{item.label}</span>
                </button>
            </Tooltip>
        );
    };

    return (
        <>
            <div css={SS.edgeRail("left")}>
                {sidebarChoices.left.map((item) =>
                    renderRailButton("left", item, true)
                )}
            </div>
            <div css={SS.edgeRail("right")}>
                {sidebarChoices.right.map((item) =>
                    renderRailButton("right", item, true)
                )}
            </div>
            <footer css={SS.bottomRail} aria-label="Editor footer">
                <ToolOverflow
                    items={sidebarChoices.bottom}
                    active={bottomSidebar?.tabs[bottomSidebar.tabIndex]?.type}
                    onSelect={(type) =>
                        handleLauncherClick(
                            "bottom",
                            type as LauncherItem["type"]
                        )
                    }
                />
                <WebMcpLink />
            </footer>
        </>
    );
};

/** Render the responsive project workspace and give visual audio tools enough dock space. */
const ProjectEditor = ({
    activeProject
}: {
    activeProject: IProject;
}): React.ReactElement => {
    useGuestReadme(activeProject);
    const compactLayout = useMediaQuery("(max-width: 900px)");
    const dispatch = useDispatch();
    const setConsole = useSetConsole();
    const [isDragging, setIsDragging] = useState(false);
    const [markdownModes, setMarkdownModes] = useState<
        Record<string, MarkdownMode>
    >({});
    const setMarkdownMode = (tabId: string, mode: MarkdownMode) => {
        setMarkdownModes((modes) => ({ ...modes, [tabId]: mode }));
    };

    const projectUid: string = activeProject?.projectUid ?? "";
    const readlineRequest = useReadlineRequest();
    useEffect(() => {
        if (
            readlineRequest?.projectUid === projectUid &&
            !compactLayout &&
            !isMobile()
        ) {
            dispatch(revealConsole());
        }
    }, [readlineRequest, projectUid, compactLayout, dispatch]);
    const projectOwnerUid: string = activeProject?.userUid ?? "";
    const projectName: string = activeProject?.name ?? "Undefined Project";
    const isOwner: boolean = useSelector(selectIsOwner);

    const projectEditorState = useSelector(
        (store: RootState) =>
            store.ProjectEditorReducer as IProjectEditorReducer
    );

    const {
        root,
        activePanelId,
        leftSidebar,
        rightSidebar,
        bottomSidebar,
        maximizedPanelId,
        nextPanelNumber,
        nextSplitNumber,
        nextTabNumber,
        tabDock
    } = projectEditorState;
    const tabDockDocuments: IOpenDocument[] = tabDock?.openDocuments ?? [];
    const tabIndex = tabDock?.tabIndex ?? -1;
    const currentMobileTab = useSelector(selectCurrentTab);

    useEffect(() => {
        retainTemporaryPlayback(projectUid, temporaryDocumentUids(root));
    }, [projectUid, root]);
    useEffect(
        () => () => {
            retainTemporaryPlayback(projectUid, []);
            stopProjectPlayback(projectUid);
            // The workspace owns all its runs, including examples and WebMCP.
            void stopPerformance(projectUid).catch(console.error);
        },
        [projectUid]
    );

    useEffect(() => {
        if (document.title !== projectName) {
            document.title = projectName;
        }
    }, [projectName]);

    useEffect(() => {
        if (setConsole) {
            setConsole([""]);
        }
    }, [projectUid, setConsole]);

    useEffect(() => {
        window.scrollTo(0, 0);
        const rootElement = document.querySelector("#root");
        rootElement && rootElement.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const unsubscribeProjectChanges = subscribeToProjectChanges(
            projectUid,
            dispatch
        );
        const unsubscribeToProjectLastModified =
            subscribeToProjectLastModified(projectUid);
        const unsubscribeToProfile =
            !isOwner && subscribeToProfile(projectOwnerUid, dispatch);
        const unsubscribeToProjectsCount =
            !isOwner && subscribeToProjectsCount(projectOwnerUid, dispatch);

        return () => {
            unsubscribeProjectChanges();
            unsubscribeToProjectLastModified.then((unsub) => unsub());
            unsubscribeToProfile && unsubscribeToProfile();
            unsubscribeToProjectsCount && unsubscribeToProjectsCount();
        };
    }, [dispatch, isOwner, projectOwnerUid, projectUid]);

    const allOpenDocuments = useMemo(
        () =>
            collectEditorTabs(root)
                .map((tab) => getDocumentForTab(tab, activeProject))
                .filter(Boolean) as AnyTab[],
        [root, activeProject]
    );
    const someUnsavedData: boolean = isOwner
        ? !!find(
              allOpenDocuments,
              (document_: IDocument) => document_.isModifiedLocally === true
          )
        : false;

    const unsavedDataExitText =
        "You still have unsaved changes, are you sure you want to quit?";
    const unsavedDataExitPrompt = someUnsavedData && (
        <React.Fragment>
            <Beforeunload onBeforeunload={() => unsavedDataExitText} />
        </React.Fragment>
    );

    useEffect(() => {
        const lastIsManualVisible = sessionStorage.getItem(
            projectUid + ":manualVisible"
        );
        if (!isEmpty(lastIsManualVisible)) {
            if (lastIsManualVisible === "true") {
                dispatch(setManualPanelOpen(true));
            }
            sessionStorage.removeItem(projectUid + ":manualVisible");
        }
    }, [dispatch, projectUid]);

    useEffect(() => {
        if (projectUid) {
            storeProjectEditorKeyboardCallbacks(projectUid, setConsole);
            storeEditorKeyboardCallbacks(projectUid);
        }
    }, [dispatch, projectUid, setConsole]);

    useEffect(() => {
        if (!projectUid) {
            return;
        }

        localStorage.setItem(
            `${projectUid}:workspaceLayout`,
            JSON.stringify(
                persistentWorkspace({
                    root,
                    activePanelId,
                    leftSidebar,
                    rightSidebar,
                    bottomSidebar,
                    maximizedPanelId,
                    nextPanelNumber,
                    nextSplitNumber,
                    nextTabNumber
                })
            )
        );

        const consoleIsOpen = Boolean(
            bottomSidebar?.tabs.some((tab) => tab.type === "console")
        );
        if (consoleIsOpen) {
            localStorage.removeItem(
                WORKSPACE_DEFAULT_CONSOLE_DISMISSED_STORAGE_KEY(projectUid)
            );
        } else {
            localStorage.setItem(
                WORKSPACE_DEFAULT_CONSOLE_DISMISSED_STORAGE_KEY(projectUid),
                "true"
            );
        }
    }, [
        activePanelId,
        bottomSidebar,
        leftSidebar,
        maximizedPanelId,
        nextPanelNumber,
        nextSplitNumber,
        nextTabNumber,
        projectUid,
        rightSidebar,
        root
    ]);

    const mobileOpenDocuments: AnyTab[] = tabDockDocuments.reduce(
        (accumulator: AnyTab[], tabDocument: IOpenDocument) => {
            const maybeDocument = activeProject.documents[tabDocument.uid];
            const isNonCloudFile =
                tabDocument.isNonCloudDocument || !!tabDocument.temporary;

            return isNonCloudFile
                ? [...accumulator, tabDocument]
                : maybeDocument && Object.keys(maybeDocument).length > 0
                  ? [...accumulator, maybeDocument]
                  : accumulator;
        },
        [] as AnyTab[]
    );

    const panelCount = useMemo(() => countWorkspacePanels(root), [root]);
    const maximizedPanel = useMemo(
        () =>
            maximizedPanelId
                ? findPanelInTree(root, maximizedPanelId)
                : undefined,
        [maximizedPanelId, root]
    );

    const bottomPanel = useRef<ImperativePanelHandle>(null);
    const bottomTool = bottomSidebar?.tabs[bottomSidebar.tabIndex]?.type;
    const largeToolOpen = [
        "sampleEditor",
        "audioAnalysis",
        "impulseResponse",
        "convolutionPrep",
        "scoreTools",
        "sdifConverter",
        "lpcEditor",
        "pvxEditor",
        "hetroEditor",
        "mixer"
    ].includes(bottomTool || "");
    useEffect(() => {
        // Give tool controls room when opening from the compact console dock.
        if (largeToolOpen && (bottomPanel.current?.getSize() || 0) < 55)
            bottomPanel.current?.resize(60);
    }, [largeToolOpen]);

    const centerContent = bottomSidebar ? (
        <PanelGroup direction="vertical">
            <ResizablePanel defaultSize={80} minSize={30}>
                <WorkspaceNodeView
                    node={root}
                    activeProject={activeProject}
                    projectUid={projectUid}
                    projectUserUid={activeProject.userUid}
                    isOwner={isOwner}
                    activePanelId={activePanelId}
                    isDragging={isDragging}
                    panelCount={panelCount}
                    markdownModes={markdownModes}
                    setMarkdownMode={setMarkdownMode}
                />
            </ResizablePanel>
            <PanelResizeHandle
                className="ProjectEditorResizer horizontal"
                onDragging={(dragging) => setIsDragging(dragging)}
            />
            <ResizablePanel
                ref={bottomPanel}
                defaultSize={largeToolOpen ? 60 : 20}
                minSize={10}
            >
                <SidebarPanelView
                    sidebar={bottomSidebar}
                    position="bottom"
                    activeProject={activeProject}
                    projectUid={projectUid}
                    projectUserUid={activeProject.userUid}
                    isOwner={isOwner}
                    isDragging={isDragging}
                />
            </ResizablePanel>
        </PanelGroup>
    ) : (
        <WorkspaceNodeView
            node={root}
            activeProject={activeProject}
            projectUid={projectUid}
            projectUserUid={activeProject.userUid}
            isOwner={isOwner}
            activePanelId={activePanelId}
            isDragging={isDragging}
            panelCount={panelCount}
            markdownModes={markdownModes}
            setMarkdownMode={setMarkdownMode}
        />
    );

    return isMobile() || compactLayout ? (
        <>
            {unsavedDataExitPrompt}
            <ProjectFileDrop
                key={projectUid}
                projectUid={projectUid}
                projectName={activeProject.name}
                isOwner={isOwner}
            />
            <MobileTabs
                activeProject={activeProject}
                projectUid={projectUid}
                currentDocument={
                    (currentMobileTab
                        ? activeProject.documents[currentMobileTab.uid]
                        : undefined) ||
                    (mobileOpenDocuments[tabIndex] as
                        | IDocument
                        | IOpenDocument
                        | undefined)
                }
            />
        </>
    ) : (
        <>
            {unsavedDataExitPrompt}
            <ProjectFileDrop
                key={projectUid}
                projectUid={projectUid}
                projectName={activeProject.name}
                isOwner={isOwner}
            />
            <DnDProvider project={activeProject}>
                <div css={SS.splitterRoot}>
                    <div css={SS.workbenchShell}>
                        <SidebarLaunchers
                            maximized={Boolean(maximizedPanel)}
                            leftSidebar={leftSidebar}
                            rightSidebar={rightSidebar}
                            bottomSidebar={bottomSidebar}
                        />
                        <div css={SS.workspaceCanvas}>
                            {maximizedPanel ? (
                                <WorkspaceNodeView
                                    node={maximizedPanel}
                                    activeProject={activeProject}
                                    projectUid={projectUid}
                                    projectUserUid={activeProject.userUid}
                                    isOwner={isOwner}
                                    activePanelId={maximizedPanel.id}
                                    isDragging={isDragging}
                                    panelCount={panelCount}
                                    markdownModes={markdownModes}
                                    setMarkdownMode={setMarkdownMode}
                                />
                            ) : (
                                <PanelGroup direction="horizontal">
                                    {leftSidebar && (
                                        <>
                                            <ResizablePanel
                                                defaultSize={18}
                                                minSize={12}
                                            >
                                                <SidebarPanelView
                                                    sidebar={leftSidebar}
                                                    position="left"
                                                    activeProject={
                                                        activeProject
                                                    }
                                                    projectUid={projectUid}
                                                    projectUserUid={
                                                        activeProject.userUid
                                                    }
                                                    isOwner={isOwner}
                                                    isDragging={isDragging}
                                                />
                                            </ResizablePanel>
                                            <PanelResizeHandle
                                                className="ProjectEditorResizer vertical"
                                                onDragging={(dragging) =>
                                                    setIsDragging(dragging)
                                                }
                                            />
                                        </>
                                    )}
                                    <ResizablePanel
                                        defaultSize={
                                            100 -
                                            (leftSidebar ? 18 : 0) -
                                            (rightSidebar ? 18 : 0)
                                        }
                                        minSize={24}
                                    >
                                        {centerContent}
                                    </ResizablePanel>
                                    {rightSidebar && (
                                        <>
                                            <PanelResizeHandle
                                                className="ProjectEditorResizer vertical"
                                                onDragging={(dragging) =>
                                                    setIsDragging(dragging)
                                                }
                                            />
                                            <ResizablePanel
                                                defaultSize={18}
                                                minSize={12}
                                            >
                                                <SidebarPanelView
                                                    sidebar={rightSidebar}
                                                    position="right"
                                                    activeProject={
                                                        activeProject
                                                    }
                                                    projectUid={projectUid}
                                                    projectUserUid={
                                                        activeProject.userUid
                                                    }
                                                    isOwner={isOwner}
                                                    isDragging={isDragging}
                                                />
                                            </ResizablePanel>
                                        </>
                                    )}
                                </PanelGroup>
                            )}
                        </div>
                    </div>
                </div>
            </DnDProvider>
        </>
    );
};

export default ProjectEditor;
