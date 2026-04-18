import React, { useEffect, useMemo, useState } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import AccountTree from "@mui/icons-material/AccountTree";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import ArrowForward from "@mui/icons-material/ArrowForward";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import CloseIcon from "@mui/icons-material/Close";
import CropFreeIcon from "@mui/icons-material/CropFree";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
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
import Editor from "../editor/editor";
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
    toggleMaximizePanel
} from "./actions";
import { isMobile } from "@root/utils";
import * as SS from "./styles";
import MobileTabs from "@comp/bottom-tabs/mobile-tabs";
import { useSetConsole } from "@comp/console/context";
import Console from "@comp/console/console";
import {
    Panel as ResizablePanel,
    PanelGroup,
    PanelResizeHandle
} from "react-resizable-panels";
import Tooltip from "@mui/material/Tooltip";

const TabStyles = tabStyles(false);

type AnyTab = IDocument | IOpenDocument | NonCloudFile;

type IEditorForDocumentProperties = {
    uid: any;
    doc: AnyTab;
    projectUid: string;
    isOwner: boolean;
};

const utilityTabDefinitions: Record<
    Exclude<WorkspaceTabType, "editor" | "fileTree" | "manual">,
    {
        title: string;
        component: React.ComponentType<any>;
    }
> = {
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
        {
            type: "piano",
            label: "Virtual Midi Keyboard",
            Icon: MusicNoteIcon
        }
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
        {
            type: "piano",
            label: "Virtual Midi Keyboard",
            Icon: MusicNoteIcon
        }
    ],
    bottom: [
        { type: "console", label: "Console", Icon: ListAltRoundedIcon },
        {
            type: "spectralAnalyzer",
            label: "Spectral Analyzer",
            Icon: GraphicEqIcon
        },
        {
            type: "piano",
            label: "Virtual Midi Keyboard",
            Icon: MusicNoteIcon
        },
        { type: "fileTree", label: "File Tree", Icon: AccountTree },
        {
            type: "manual",
            label: "Csound Manual",
            Icon: AutoStoriesRoundedIcon
        }
    ]
};

export function EditorForDocument({
    uid,
    projectUid,
    doc
}: IEditorForDocumentProperties) {
    if ((doc as IDocument).type === "txt") {
        return (
            <Editor
                documentUid={(doc as IDocument).documentUid}
                projectUid={projectUid}
            />
        );
    } else if (
        (doc as IDocument).type === "bin" &&
        isAudioFile((doc as IDocument).filename)
    ) {
        const path = `${uid}/${projectUid}/${(doc as IDocument).documentUid}`;
        return <AudioEditor audioFileUrl={path} />;
    } else if (
        (doc as IOpenDocument).isNonCloudDocument &&
        (doc as IOpenDocument).nonCloudFileAudioUrl
    ) {
        return (
            <AudioEditor
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

    if (tab.isNonCloudDocument) {
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
        return "File Tree";
    }

    if (tab.type === "manual") {
        return "Csound Manual";
    }

    if (tab.type !== "editor") {
        return utilityTabDefinitions[tab.type].title;
    }

    const document = getDocumentForTab(tab, activeProject);
    const label =
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
    isDragging
}: {
    tab: IWorkspaceTab;
    activeProject: IProject;
    projectUid: string;
    projectUserUid: string;
    isOwner: boolean;
    isDragging: boolean;
}) => {
    if (tab.type === "editor") {
        const document = getDocumentForTab(tab, activeProject);
        return document ? (
            <EditorForDocument
                uid={projectUserUid}
                projectUid={projectUid}
                isOwner={isOwner}
                doc={document}
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
            <Component />
        </React.Suspense>
    );
};

const WorkspacePanelTabs = ({
    panel,
    activeProject,
    projectUserUid,
    isOwner,
    title,
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
    title: string;
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
            <div css={SS.panelTopBar}>
                <span css={SS.panelTopBarTitle}>{title}</span>
                {actions && <div css={SS.panelActionGroup}>{actions}</div>}
            </div>
            <div css={SS.panelTabsBody}>
                <div css={tabListStyle as any} style={{ position: "relative" }}>
                    <Tabs
                        defaultIndex={safeIndex}
                        activeIndex={safeIndex}
                        onTabChange={onTabChange}
                        customStyle={TabStyles}
                        showModalButton={false}
                        showArrowButton={"auto"}
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
                        <DragTabList
                            id={`workspace-panel-${panel.id}`}
                            handleTabSequence={
                                onTabSequenceChange
                                    ? ({
                                          oldIndex,
                                          newIndex
                                      }: {
                                          oldIndex: number;
                                          newIndex: number;
                                      }) =>
                                          onTabSequenceChange(
                                              oldIndex,
                                              newIndex
                                          )
                                    : undefined
                            }
                            handleTabChange={onTabChange}
                        >
                            {panel.tabs.map((tab, index) => (
                                <DragTab
                                    id={`workspace-tab-${tab.id}`}
                                    closable={true}
                                    key={tab.id}
                                    closeCallback={() => onCloseTab(tab)}
                                    currentIndex={safeIndex}
                                    thisIndex={index}
                                    CustomTabStyle={TabStyles.Tab}
                                    handleTabChange={onTabChange}
                                    index={index}
                                    active={index === safeIndex}
                                >
                                    <p style={{ margin: 0 }}>
                                        {getWorkspaceTabTitle(
                                            tab,
                                            activeProject,
                                            isOwner
                                        )}
                                    </p>
                                </DragTab>
                            ))}
                        </DragTabList>
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

    return (
        <WorkspacePanelTabs
            panel={sidebar}
            activeProject={activeProject}
            projectUserUid={projectUserUid}
            isOwner={isOwner}
            title={
                activeTab
                    ? getWorkspaceTabTitle(activeTab, activeProject, isOwner)
                    : `${position} sidebar`
            }
            isActive={false}
            onTabChange={(index) =>
                dispatch(setSidebarTabIndex(position, index))
            }
            onCloseTab={(tab) => dispatch(closeSidebarTab(position, tab.id))}
            renderTabContent={(tab) =>
                renderWorkspaceTabContent({
                    tab,
                    activeProject,
                    projectUid,
                    projectUserUid,
                    isOwner,
                    isDragging
                })
            }
        />
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
    panelCount
}: {
    node: IWorkspaceLayoutNode;
    activeProject: IProject;
    projectUid: string;
    projectUserUid: string;
    isOwner: boolean;
    activePanelId: string;
    isDragging: boolean;
    panelCount: number;
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
                    />
                </ResizablePanel>
                <PanelResizeHandle className={`Resizer ${node.direction}`} />
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
                    />
                </ResizablePanel>
            </PanelGroup>
        );
    }

    const panelTabIds = node.tabs.map((tab) => tab.id);
    const activeTab = node.tabs[Math.min(node.tabIndex, node.tabs.length - 1)];

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
                title={
                    activeTab
                        ? getWorkspaceTabTitle(
                              activeTab,
                              activeProject,
                              isOwner
                          )
                        : "Workspace"
                }
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
                        isDragging
                    })
                }
                actions={
                    <>
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
        return null;
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
            <Tooltip key={`${sidebar}-${item.type}`} title={item.label}>
                <button
                    type="button"
                    css={SS.activityButton({ active: isActive, compact })}
                    onClick={() => handleLauncherClick(sidebar, item.type)}
                    aria-label={item.label}
                    aria-pressed={isActive}
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
            <div css={SS.bottomRail}>
                {sidebarChoices.bottom.map((item) =>
                    renderRailButton("bottom", item, false)
                )}
            </div>
        </>
    );
};

const ProjectEditor = ({
    activeProject
}: {
    activeProject: IProject;
}): React.ReactElement => {
    const dispatch = useDispatch();
    const setConsole = useSetConsole() as
        | ((value: string[] | ((logs: string[]) => string[])) => void)
        | undefined;
    const [isDragging, setIsDragging] = useState(false);

    const projectUid: string = activeProject?.projectUid ?? "";
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
            storeProjectEditorKeyboardCallbacks(projectUid);
            storeEditorKeyboardCallbacks(projectUid);
        }
    }, [dispatch, projectUid]);

    useEffect(() => {
        if (!projectUid) {
            return;
        }

        localStorage.setItem(
            `${projectUid}:workspaceLayout`,
            JSON.stringify({
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
        );
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
            const isNonCloudFile = tabDocument.isNonCloudDocument || false;

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

    const centerContent = bottomSidebar ? (
        <PanelGroup direction="vertical">
            <ResizablePanel defaultSize={76}>
                <WorkspaceNodeView
                    node={root}
                    activeProject={activeProject}
                    projectUid={projectUid}
                    projectUserUid={activeProject.userUid}
                    isOwner={isOwner}
                    activePanelId={activePanelId}
                    isDragging={isDragging}
                    panelCount={panelCount}
                />
            </ResizablePanel>
            <PanelResizeHandle
                className="Resizer horizontal"
                onDragging={(dragging) => setIsDragging(dragging)}
            />
            <ResizablePanel defaultSize={24}>
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
        />
    );

    return isMobile() ? (
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
    ) : (
        <>
            {unsavedDataExitPrompt}
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
                                                className="Resizer vertical"
                                                onDragging={(dragging) =>
                                                    setIsDragging(dragging)
                                                }
                                            />
                                        </>
                                    )}
                                    <ResizablePanel
                                        defaultSize={64}
                                        minSize={24}
                                    >
                                        {centerContent}
                                    </ResizablePanel>
                                    {rightSidebar && (
                                        <>
                                            <PanelResizeHandle
                                                className="Resizer vertical"
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
