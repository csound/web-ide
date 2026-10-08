import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { useLocalStorage } from "react-use-storage";
import SelectedIcon from "@mui/icons-material/DoneSharp";
import NestedMenuIcon from "@mui/icons-material/ArrowRightSharp";
import Dialog from "@mui/material/Dialog";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import EditIcon from "@mui/icons-material/Edit";
import BuildIcon from "@mui/icons-material/Build";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SettingsInputComponentIcon from "@mui/icons-material/SettingsInputComponent";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import useMediaQuery from "@mui/material/useMediaQuery";
import * as SS from "./styles";
import { hr as hrCss } from "@styles/_common";
import { MenuItemDef } from "./types";
import { useSetConsole } from "@comp/console/context";
import { invokeHotKeyCallback } from "@comp/hot-keys/actions";
import { humanizeKeySequence } from "@comp/hot-keys/utils";
import { showTargetsConfigDialog } from "@comp/target-controls/actions";
import { openForkProject } from "@comp/projects/fork-project";
import { exportProject, markProjectPublic } from "@comp/projects/actions";
import {
    openSidebarTab,
    closeSidebarTab,
    toggleManualPanel,
    setFileTreePanelOpen
} from "@comp/project-editor/actions";
import { renderToDisk, listAvailableOpcodes } from "@comp/csound/actions";
import { selectCsoundStatus } from "@comp/csound/selectors";
import {
    selectCurrentTab,
    selectIsOwnerForProject
} from "@comp/project-editor/selectors";
import {
    filenameToCsoundType,
    supportsFileEvaluation
} from "@comp/csound/utils";
import { changeTheme } from "@comp/themes/action";
import { equals, isEmpty } from "ramda";
import { showKeyboardShortcuts } from "@comp/site-documents/actions";
import { isMobile } from "@root/utils";
import { openSimpleModal } from "@comp/modal/actions";
import { starOrUnstarProject } from "@comp/profile/actions";
import {
    selectUserStarredProject,
    selectProjectPublic
} from "@comp/social-controls/selectors";
import { selectLoggedInUid } from "@comp/login/selectors";
import {
    closeMobileDock,
    closeMobileTopMenu,
    popMobileTopMenuPath,
    pushMobileTopMenuPath,
    resetMobileTopMenuPath,
    toggleMobileDock,
    toggleMobileTopMenu
} from "@comp/menu-ui/actions";
import {
    selectIsMobileDockOpen,
    selectIsMobileTopMenuOpen,
    selectMobileTopMenuPath
} from "@comp/menu-ui/selectors";
import { IProjectEditorReducer } from "@comp/project-editor/reducer";
import { IWorkspaceTab } from "@comp/project-editor/types";

/** Build project menus from current state and handle desktop and mobile menu navigation. */
export function MenuBar({ projectUid }: { projectUid?: string }) {
    const setConsole = useSetConsole();
    const menuRootRef = useRef<HTMLDivElement | null>(null);
    const mobileActionsRef = useRef<HTMLUListElement | null>(null);
    const pendingMobileFocus = useRef<number | "first" | null>(null);

    const activeProjectUid = useSelector(
        (store: RootState) => store.ProjectsReducer.activeProjectUid || ""
    );
    const resolvedProjectUid = projectUid || activeProjectUid;

    const dispatch = useDispatch();
    const isOwner = useSelector(selectIsOwnerForProject(resolvedProjectUid));
    const csoundStatus = useSelector(selectCsoundStatus);
    const fileEvaluationSupported = useSelector((store: RootState) => {
        const currentTab = selectCurrentTab(store);
        const filename =
            currentTab?.uid &&
            store.ProjectsReducer.projects[resolvedProjectUid]?.documents[
                currentTab.uid
            ]?.filename;
        return supportsFileEvaluation(filenameToCsoundType(filename || ""));
    });
    const projectEditorState = useSelector(
        (store: RootState) =>
            store.ProjectEditorReducer as IProjectEditorReducer
    );
    const keyBindings = useSelector(
        (store: RootState) => store.HotKeysReducer.bindings
    );

    const selectedThemeName = useSelector(
        (store: RootState) => store.ThemeReducer.selectedThemeName
    );

    const isManualOpen = projectEditorState.manualVisible;

    const isConsoleVisible = (
        projectEditorState.bottomSidebar?.tabs || []
    ).some((tab: IWorkspaceTab) => tab.type === "console");

    const isFileTreeVisible = projectEditorState.fileTreeVisible;

    const isSpectralAnalyzerVisible = (
        projectEditorState.bottomSidebar?.tabs || []
    ).some((tab: IWorkspaceTab) => tab.type === "spectralAnalyzer");

    const isMidiPianoVisible = (
        projectEditorState.bottomSidebar?.tabs || []
    ).some((tab: IWorkspaceTab) => tab.type === "piano");

    const isMobileMenuOpen = useSelector(selectIsMobileTopMenuOpen);
    const mobilePath = useSelector(selectMobileTopMenuPath);
    const isMobileDockVisible = useSelector(selectIsMobileDockOpen);

    const loggedInUid = useSelector(selectLoggedInUid);
    const isPublic = useSelector(selectProjectPublic(resolvedProjectUid));
    const starred = useSelector(
        selectUserStarredProject(loggedInUid, resolvedProjectUid)
    );

    const [isSabEnabled, setIsSabEnabled] = useLocalStorage("sab", "false");
    const [openPath, setOpenPath] = useState<number[]>([]);
    const isCompactViewport = useMediaQuery("(max-width:900px)");
    const mobileView = isMobile() || isCompactViewport;

    const menuBarItems: MenuItemDef[] = useMemo(
        () => [
            {
                label: "File",
                submenu: [
                    {
                        label: "New File…",
                        hotKey: "new_document",
                        disabled: !isOwner
                    },
                    {
                        label: "Add File(s)…",
                        hotKey: "add_file",
                        disabled: !isOwner
                    },
                    {
                        label: "Save Document",
                        hotKey: "save_document",
                        disabled: !isOwner
                    },
                    {
                        label: "Save All",
                        hotKey: "save_all_documents",
                        disabled: !isOwner
                    },
                    {
                        seperator: true
                    },
                    {
                        label: "Render to Disk",
                        disabled: [
                            "loading",
                            "rendering",
                            "playing",
                            "paused"
                        ].includes(csoundStatus),
                        callback: () => dispatch(renderToDisk(setConsole))
                    },
                    {
                        label: "Export Project (.zip)",
                        callback: () => dispatch(exportProject())
                    },
                    {
                        seperator: true
                    },
                    {
                        label: isOwner ? "Save and Close" : "Close",
                        hotKey: "save_and_close"
                    }
                ]
            },
            {
                label: "Edit",
                submenu: [
                    { label: "Undo", hotKey: "undo" },
                    { label: "Redo", hotKey: "redo" },
                    { label: "Search", hotKey: "find_simple" },
                    {
                        label: "Eval Selection / Form",
                        hotKey: "eval",
                        disabled: csoundStatus !== "playing"
                    },
                    {
                        label: "Eval Block",
                        hotKey: "eval_block",
                        disabled: csoundStatus !== "playing"
                    },
                    {
                        label: "Eval File",
                        hotKey: "eval_file",
                        disabled:
                            csoundStatus !== "playing" ||
                            !fileEvaluationSupported
                    },
                    {
                        label: "Theme",
                        submenu: [
                            {
                                label: "Default",
                                callback: () =>
                                    dispatch(changeTheme("default")),
                                checked: selectedThemeName === "default"
                            },
                            {
                                label: "GitHub Modern",
                                callback: () => dispatch(changeTheme("github")),
                                checked: selectedThemeName === "github"
                            },
                            {
                                label: "GitHub Light",
                                callback: () =>
                                    dispatch(changeTheme("github-light")),
                                checked: selectedThemeName === "github-light"
                            },
                            {
                                label: "Dracula",
                                callback: () =>
                                    dispatch(changeTheme("dracula")),
                                checked: selectedThemeName === "dracula"
                            },
                            {
                                label: "Nord",
                                callback: () => dispatch(changeTheme("nord")),
                                checked: selectedThemeName === "nord"
                            },
                            {
                                label: "Solarized Dark",
                                callback: () =>
                                    dispatch(changeTheme("solarized-dark")),
                                checked: selectedThemeName === "solarized-dark"
                            }
                        ]
                    }
                ]
            },
            {
                label: "Project",
                submenu: [
                    {
                        label:
                            csoundStatus === "paused" ? "Resume" : "Run/Play",
                        hotKey: "run_project",
                        disabled: csoundStatus === "playing"
                    },
                    {
                        label: "Stop",
                        hotKey: "stop_playback",
                        disabled:
                            csoundStatus !== "playing" &&
                            csoundStatus !== "paused"
                    },
                    {
                        label: "Pause",
                        hotKey: "pause_playback",
                        disabled: csoundStatus !== "playing"
                    },
                    {
                        seperator: true
                    },
                    {
                        label: "Configure Targets",
                        callback: () => dispatch(showTargetsConfigDialog()),
                        disabled: !isOwner
                    },
                    {
                        seperator: true
                    },
                    {
                        label: "Fork Project",
                        callback: () =>
                            dispatch(openForkProject(resolvedProjectUid)),
                        disabled: !isPublic && !isOwner
                    },
                    {
                        label: "Share Project",
                        callback: () =>
                            dispatch(openSimpleModal("share-dialog", {})),
                        disabled: !isPublic && !isOwner
                    },
                    {
                        label: starred ? "Unstar Project" : "Star Project",
                        callback: () => {
                            if (resolvedProjectUid && loggedInUid) {
                                dispatch(
                                    starOrUnstarProject(
                                        resolvedProjectUid,
                                        loggedInUid
                                    )
                                );
                            }
                        },
                        disabled: !loggedInUid
                    },
                    {
                        label: "Download Project (.zip)",
                        callback: () => dispatch(exportProject()),
                        disabled: !isPublic && !isOwner
                    }
                ]
            },
            {
                label: "View",
                submenu: [
                    {
                        label: "Csound Manual",
                        callback: () => dispatch(toggleManualPanel()),
                        checked: isManualOpen
                    },
                    {
                        label: "File Tree",
                        callback: () =>
                            dispatch(setFileTreePanelOpen(!isFileTreeVisible)),
                        checked: isFileTreeVisible
                    },
                    {
                        label: "Console",
                        callback: () => {
                            if (isConsoleVisible) {
                                const tab = (
                                    projectEditorState.bottomSidebar?.tabs || []
                                ).find(
                                    (t: IWorkspaceTab) => t.type === "console"
                                );
                                if (tab)
                                    dispatch(closeSidebarTab("bottom", tab.id));
                            } else {
                                dispatch(openSidebarTab("bottom", "console"));
                            }
                        },
                        checked: isConsoleVisible
                    },
                    {
                        label: "Spectral Analyzer",
                        callback: () => {
                            if (isSpectralAnalyzerVisible) {
                                const tab = (
                                    projectEditorState.bottomSidebar?.tabs || []
                                ).find(
                                    (t: IWorkspaceTab) =>
                                        t.type === "spectralAnalyzer"
                                );
                                if (tab)
                                    dispatch(closeSidebarTab("bottom", tab.id));
                            } else {
                                dispatch(
                                    openSidebarTab("bottom", "spectralAnalyzer")
                                );
                            }
                        },
                        checked: isSpectralAnalyzerVisible
                    },
                    ...(
                        [
                            ["sampleEditor", "Sample Editor"],
                            ["audioAnalysis", "Audio Analysis"],
                            ["scoreTools", "Score Converter"],
                            ["lpcEditor", "LPC Editor"]
                        ] as const
                    ).map(([type, label]) => {
                        const tab = projectEditorState.bottomSidebar?.tabs.find(
                            (item: IWorkspaceTab) => item.type === type
                        );
                        return {
                            label,
                            checked: Boolean(tab),
                            callback: () =>
                                dispatch(
                                    tab
                                        ? closeSidebarTab("bottom", tab.id)
                                        : openSidebarTab("bottom", type)
                                )
                        };
                    }),
                    {
                        label: "Virtual Midi Keyboard",
                        callback: () => {
                            if (isMidiPianoVisible) {
                                const tab = (
                                    projectEditorState.bottomSidebar?.tabs || []
                                ).find(
                                    (t: IWorkspaceTab) => t.type === "piano"
                                );
                                if (tab)
                                    dispatch(closeSidebarTab("bottom", tab.id));
                            } else {
                                dispatch(openSidebarTab("bottom", "piano"));
                            }
                        },
                        checked: isMidiPianoVisible
                    }
                ]
            },
            {
                label: "I/O",
                submenu: [
                    {
                        label: "Enable SharedArrayBuffer",
                        checked: isSabEnabled === "true",
                        callback: () => {
                            setIsSabEnabled(
                                isSabEnabled === "true" ? "false" : "true"
                            );
                        }
                    }
                ]
            },
            {
                label: "Help",
                submenu: [
                    {
                        label: "Csound Manual (External)",
                        callback: () => {
                            window.open("/manual/", "_blank");
                        }
                    },
                    {
                        label: "Csound FLOSS Manual",
                        callback: () => {
                            window.open(
                                "https://flossmanual.csound.com/",
                                "_blank"
                            );
                        }
                    },
                    {
                        seperator: true
                    },
                    {
                        label: "Web-IDE Documentation",
                        callback: () => {
                            window.open("/documentation", "_blank");
                        }
                    },
                    {
                        seperator: true
                    },
                    {
                        label: "Report an Issue",
                        callback: () => {
                            window.open(
                                "https://github.com/csound/web-ide/issues",
                                "_blank"
                            );
                        }
                    },
                    {
                        label: "Github Project",
                        callback: () => {
                            window.open(
                                "https://github.com/csound/web-ide",
                                "_blank"
                            );
                        }
                    },
                    {
                        label: "Show Keyboard Shortcuts",
                        callback: () => dispatch(showKeyboardShortcuts())
                    },
                    {
                        seperator: true
                    },
                    {
                        label: "List Available Opcodes",
                        callback: listAvailableOpcodes
                    }
                ]
            }
        ],
        [
            csoundStatus,
            fileEvaluationSupported,
            dispatch,
            isConsoleVisible,
            isFileTreeVisible,
            isManualOpen,
            isMidiPianoVisible,
            isOwner,
            isPublic,
            isSabEnabled,
            isSpectralAnalyzerVisible,
            projectEditorState.bottomSidebar,
            loggedInUid,
            resolvedProjectUid,
            selectedThemeName,
            setConsole,
            setIsSabEnabled,
            starred
        ]
    );

    useEffect(() => {
        if (mobileView) return;
        const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
            const targetNode = event.target as Node | null;
            if (!targetNode) {
                return;
            }
            if (
                menuRootRef.current &&
                !menuRootRef.current.contains(targetNode)
            ) {
                setOpenPath([]);
                dispatch(closeMobileTopMenu());
            }
        };

        document.addEventListener("mousedown", closeOnOutsideClick, true);
        document.addEventListener("touchstart", closeOnOutsideClick, {
            capture: true,
            passive: true
        });

        return () => {
            document.removeEventListener(
                "mousedown",
                closeOnOutsideClick,
                true
            );
            document.removeEventListener("touchstart", closeOnOutsideClick, {
                capture: true
            });
        };
    }, [dispatch, mobileView]);

    useEffect(() => {
        if (mobileView) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") {
                return;
            }
            setOpenPath([]);
            dispatch(closeMobileDock());
            dispatch(closeMobileTopMenu());
        };

        window.addEventListener("keydown", closeOnEscape);

        return () => {
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [dispatch, mobileView]);

    useEffect(() => {
        if (!mobileView) dispatch(closeMobileDock());
    }, [dispatch, mobileView]);

    useLayoutEffect(() => {
        const target = pendingMobileFocus.current;
        pendingMobileFocus.current = null;
        if (!isMobileDockVisible || target === null) return;
        const selector =
            target === "first"
                ? "button:not(:disabled)"
                : `button[data-menu-action-index="${target}"]:not(:disabled)`;
        mobileActionsRef.current
            ?.querySelector<HTMLButtonElement>(selector)
            ?.focus();
    }, [mobilePath, isMobileDockVisible]);

    // Close dock and panel state when component unmounts (e.g. navigating away)
    useEffect(() => {
        return () => {
            dispatch(closeMobileDock());
        };
    }, [dispatch]);

    const runMenuItem = useCallback(
        (item: MenuItemDef, event?: React.MouseEvent) => {
            if (item.disabled) {
                event?.preventDefault();
                return;
            }

            if (item.hotKey) {
                invokeHotKeyCallback(item.hotKey);
            } else {
                item.callback && item.callback();
                event?.preventDefault();
            }

            if (mobileView) {
                dispatch(closeMobileTopMenu());
                dispatch(closeMobileDock());
            }
        },
        [dispatch, mobileView]
    );

    const getItemsAtPath = useCallback(
        (items: MenuItemDef[], nestingPath: number[]): MenuItemDef[] => {
            let currentItems = items;
            for (const pathIndex of nestingPath) {
                currentItems = currentItems[pathIndex]?.submenu || [];
            }
            return currentItems;
        },
        []
    );

    const isPathOpen = (
        targetPath: number[],
        openedPath: number[]
    ): boolean => {
        if (targetPath.length > openedPath.length) {
            return false;
        }
        return targetPath.every((value, index) => value === openedPath[index]);
    };

    const topLevelIcon = (label: string | undefined): React.ReactNode => {
        switch (label) {
            case "File":
                return <InsertDriveFileIcon />;
            case "Edit":
                return <EditIcon />;
            case "Project":
                return <BuildIcon />;
            case "View":
                return <VisibilityIcon />;
            case "I/O":
                return <SettingsInputComponentIcon />;
            case "Help":
                return <HelpOutlineIcon />;
            default:
                return <MenuIcon />;
        }
    };

    const reduceRow = (
        items: MenuItemDef[],
        openedPath: number[],
        rowNesting: number[]
    ): React.ReactNode[] =>
        items.map((item, index) => {
            const thisRowNesting = [...rowNesting, index];
            const hasChild: boolean = item.submenu !== undefined;

            if (item.seperator) {
                return (
                    <hr
                        key={`separator-${thisRowNesting.join("-")}`}
                        css={hrCss}
                    />
                );
            } else {
                const hotKeySequence = item.hotKey
                    ? keyBindings?.[item.hotKey]
                    : undefined;
                const primarySequence = Array.isArray(hotKeySequence)
                    ? hotKeySequence[0]
                    : hotKeySequence;
                const hotKeyLabel =
                    typeof primarySequence === "string"
                        ? humanizeKeySequence(primarySequence)
                        : "";

                return (
                    <div
                        key={thisRowNesting.join("-")}
                        onClick={(event) => {
                            runMenuItem(item, event);
                        }}
                        css={hasChild && SS.nestedWrapper}
                        onMouseOver={() => {
                            setOpenPath(thisRowNesting);
                        }}
                    >
                        {hasChild && isPathOpen(thisRowNesting, openedPath) && (
                            <ul
                                role="menu"
                                css={SS.dropdownListNested}
                                style={{
                                    zIndex: thisRowNesting.length
                                }}
                                onMouseOver={(event) => {
                                    thisRowNesting.length > openedPath.length &&
                                        setOpenPath([
                                            ...openedPath.slice(
                                                0,
                                                thisRowNesting.length
                                            ),
                                            0
                                        ]);
                                    event.stopPropagation();
                                }}
                            >
                                {reduceRow(
                                    item.submenu || [],
                                    openedPath,
                                    thisRowNesting
                                )}
                            </ul>
                        )}

                        <li
                            role="menuitem"
                            tabIndex={0}
                            css={
                                item.disabled
                                    ? SS.listItemDisabled
                                    : SS.listItem
                            }
                        >
                            {item.checked && (
                                <SelectedIcon css={SS.selectedIcon} />
                            )}
                            <p css={SS.paraLabel}>{item.label}</p>
                            {hotKeyLabel && (
                                <i css={SS.paraLabel}>{hotKeyLabel}</i>
                            )}
                            {hasChild && (
                                <NestedMenuIcon css={SS.nestedMenuIcon} />
                            )}
                        </li>
                    </div>
                );
            }
        });

    const mobileColumns = () => {
        const activeTopLevelIndex = mobilePath.length > 0 ? mobilePath[0] : 0;
        const activePath =
            mobilePath.length > 0 ? mobilePath : [activeTopLevelIndex];
        const currentItems = getItemsAtPath(menuBarItems, activePath);
        const activeTopLevelItem = menuBarItems[activeTopLevelIndex];
        const currentLabel =
            activePath.length > 1
                ? getItemsAtPath(menuBarItems, activePath.slice(0, -1))[
                      activePath[activePath.length - 1]
                  ]?.label
                : activeTopLevelItem?.label || "Menu";

        const toggleDockFromHeader = () => {
            if (isMobileDockVisible) {
                dispatch(closeMobileDock());
                return;
            }

            dispatch(toggleMobileDock());
            dispatch(toggleMobileTopMenu());
            dispatch(pushMobileTopMenuPath(0));
        };

        const selectTopLevel = (index: number) => {
            if (!isMobileMenuOpen) dispatch(toggleMobileTopMenu());
            dispatch(resetMobileTopMenuPath());
            dispatch(pushMobileTopMenuPath(index));
        };

        return (
            <>
                <button
                    type="button"
                    css={SS.mobileTopTriggerButton(isMobileDockVisible)}
                    aria-label={
                        isMobileDockVisible
                            ? "Close editor menu"
                            : "Open editor menu"
                    }
                    aria-expanded={isMobileDockVisible}
                    aria-haspopup="dialog"
                    aria-controls={
                        isMobileDockVisible ? "mobile-editor-menu" : undefined
                    }
                    onClick={toggleDockFromHeader}
                >
                    <MenuIcon />
                </button>

                <Dialog
                    id="mobile-editor-menu"
                    open={isMobileDockVisible}
                    onClose={() => dispatch(closeMobileDock())}
                    aria-labelledby="mobile-menu-title"
                    css={SS.mobileDialog}
                    maxWidth={false}
                    transitionDuration={0}
                >
                    <div css={SS.mobilePanelHeader}>
                        <h2 id="mobile-menu-title" css={SS.mobilePanelTitle}>
                            Editor menu
                        </h2>
                        <button
                            type="button"
                            css={SS.mobileBackButton}
                            aria-label="Close editor menu"
                            onClick={() => dispatch(closeMobileDock())}
                        >
                            <CloseIcon />
                        </button>
                    </div>
                    <div
                        css={SS.mobileRail}
                        role="group"
                        aria-label="Menu categories"
                    >
                        {menuBarItems.map((item, index) => (
                            <button
                                key={item.label || index}
                                type="button"
                                css={SS.mobileRailButton(
                                    index === activeTopLevelIndex
                                )}
                                onClick={() => selectTopLevel(index)}
                                aria-label={item.label || "Menu"}
                                aria-pressed={index === activeTopLevelIndex}
                            >
                                {topLevelIcon(item.label)}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                    <div css={SS.mobilePanelHeader}>
                        {activePath.length > 1 ? (
                            <button
                                type="button"
                                css={SS.mobileBackButton}
                                onClick={() => {
                                    pendingMobileFocus.current =
                                        activePath[activePath.length - 1];
                                    dispatch(popMobileTopMenuPath());
                                }}
                                aria-label="Go back"
                            >
                                <ArrowBackIcon />
                                <span>{currentLabel}</span>
                            </button>
                        ) : (
                            <h3 css={SS.mobilePanelTitle}>{currentLabel}</h3>
                        )}
                    </div>
                    <ul
                        ref={mobileActionsRef}
                        id="mobile-top-menu"
                        css={SS.mobilePanelList}
                        aria-label={currentLabel}
                    >
                        {currentItems.map((item, index) =>
                            item.seperator ? (
                                <li key={index}>
                                    <hr css={hrCss} />
                                </li>
                            ) : (
                                <li key={index}>
                                    <button
                                        type="button"
                                        css={SS.mobileMenuAction}
                                        data-menu-action-index={index}
                                        disabled={item.disabled}
                                        aria-pressed={
                                            typeof item.checked === "boolean"
                                                ? item.checked
                                                : undefined
                                        }
                                        onClick={(event) => {
                                            if (item.submenu) {
                                                pendingMobileFocus.current =
                                                    "first";
                                                dispatch(
                                                    pushMobileTopMenuPath(index)
                                                );
                                            } else runMenuItem(item, event);
                                        }}
                                    >
                                        <span css={SS.mobileCheck}>
                                            {item.checked && <SelectedIcon />}
                                        </span>
                                        <span>{item.label}</span>
                                        {item.submenu && <NestedMenuIcon />}
                                    </button>
                                </li>
                            )
                        )}
                    </ul>
                </Dialog>
            </>
        );
    };

    const columns = (openPath: number[]) =>
        menuBarItems.map((item, index) => {
            const anyColIsOpen = !isEmpty(openPath);
            const thisColIsOpen =
                !isEmpty(openPath) && equals(openPath[0], index);
            const row = (
                <ul
                    role="menu"
                    style={{ display: thisColIsOpen ? "inline" : "none" }}
                    css={SS.dropdownList}
                >
                    {!isEmpty(openPath) &&
                        !isEmpty(item.submenu) &&
                        reduceRow(item.submenu || [], openPath, [index])}
                </ul>
            );
            return (
                <div
                    css={SS.dropdownButtonWrapper}
                    key={index}
                    onClick={() => {
                        thisColIsOpen ? setOpenPath([]) : setOpenPath([index]);
                    }}
                >
                    <div
                        css={SS.dropdownButton}
                        onMouseOver={() => anyColIsOpen && setOpenPath([index])}
                    >
                        <span>{item.label}</span>
                    </div>
                    {row}
                </div>
            );
        });

    return (
        <>
            <div css={SS.root} ref={menuRootRef}>
                {mobileView ? mobileColumns() : columns(openPath)}
            </div>
        </>
    );
}
