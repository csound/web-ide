import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { useLocalStorage } from "react-use-storage";
import SelectedIcon from "@mui/icons-material/DoneSharp";
import NestedMenuIcon from "@mui/icons-material/ArrowRightSharp";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import * as SS from "./styles";
import { hr as hrCss } from "@styles/_common";
import { MenuItemDef } from "./types";
import { useSetConsole } from "@comp/console/context";
import { invokeHotKeyCallback } from "@comp/hot-keys/actions";
import { BindingsMap } from "@comp/hot-keys/types";
import { humanizeKeySequence } from "@comp/hot-keys/utils";
import { showTargetsConfigDialog } from "@comp/target-controls/actions";
import { exportProject } from "@comp/projects/actions";
import {
    toggleManualPanel,
    setFileTreePanelOpen
} from "@comp/project-editor/actions";
import { renderToDisk } from "@comp/csound/actions";
import { selectCsoundStatus } from "@comp/csound/selectors";
import { selectIsOwner } from "@comp/project-editor/selectors";
import { changeTheme } from "@comp/themes/action";
import { equals, isEmpty } from "ramda";
import { showKeyboardShortcuts } from "@comp/site-documents/actions";
import { openBottomTab } from "@comp/bottom-tabs/actions";
import { isMobile } from "@root/utils";
import {
    closeMobileTopMenu,
    popMobileTopMenuPath,
    pushMobileTopMenuPath,
    resetMobileTopMenuPath,
    toggleMobileTopMenu
} from "@comp/menu-ui/actions";
import {
    selectIsMobileTopMenuOpen,
    selectMobileTopMenuPath
} from "@comp/menu-ui/selectors";

export function MenuBar() {
    const setConsole = useSetConsole();
    const menuRootRef = useRef<HTMLUListElement | null>(null);
    const firstMobileItemRef = useRef<HTMLLIElement | null>(null);

    const activeProjectUid = useSelector(
        (store: RootState) => store.ProjectsReducer.activeProjectUid || ""
    );

    const dispatch = useDispatch();
    const isOwner = useSelector(selectIsOwner);
    const csoundStatus = useSelector(selectCsoundStatus);
    const keyBindings = useSelector(
        (store: RootState) => store.HotKeysReducer.bindings
    );

    const selectedThemeName = useSelector(
        (store: RootState) => store.ThemeReducer.selectedThemeName
    );

    const isManualOpen = useSelector(
        (store: RootState) => store.ProjectEditorReducer.manualVisible
    );

    const isConsoleVisible = useSelector((store: RootState) =>
        (store.BottomTabsReducer.openTabs || []).includes("console")
    );

    const isFileTreeVisible = useSelector(
        (store: RootState) => store.ProjectEditorReducer.fileTreeVisible
    );

    const isSpectralAnalyzerVisible = useSelector((store: RootState) =>
        store.BottomTabsReducer.openTabs.includes("spectralAnalyzer")
    );

    const isMidiPianoVisible = useSelector((store: RootState) =>
        store.BottomTabsReducer.openTabs.includes("piano")
    );

    const isMobileMenuOpen = useSelector(selectIsMobileTopMenuOpen);
    const mobilePath = useSelector(selectMobileTopMenuPath);

    const [isSabEnabled, setIsSabEnabled] = useLocalStorage("sab", "false");
    const [openPath, setOpenPath] = useState<number[]>([]);
    const mobileView = isMobile();

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
                        callback: () => dispatch(openBottomTab("console")),
                        checked: isConsoleVisible
                    },
                    {
                        label: "Spectral Analyzer",
                        callback: () =>
                            dispatch(openBottomTab("spectralAnalyzer")),
                        checked: isSpectralAnalyzerVisible
                    },
                    {
                        label: "Virtual Midi Keyboard",
                        callback: () => dispatch(openBottomTab("piano")),
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
                            window.open(
                                "https://csound.com/docs/manual",
                                "_blank"
                            );
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
                        label: "Show Keyboard Shortcuts",
                        callback: () => dispatch(showKeyboardShortcuts())
                    }
                ]
            }
        ],
        [
            csoundStatus,
            dispatch,
            isConsoleVisible,
            isFileTreeVisible,
            isManualOpen,
            isMidiPianoVisible,
            isOwner,
            isSabEnabled,
            isSpectralAnalyzerVisible,
            selectedThemeName,
            setConsole,
            setIsSabEnabled
        ]
    );

    useEffect(() => {
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
        document.addEventListener("touchstart", closeOnOutsideClick, true);

        return () => {
            document.removeEventListener(
                "mousedown",
                closeOnOutsideClick,
                true
            );
            document.removeEventListener(
                "touchstart",
                closeOnOutsideClick,
                true
            );
        };
    }, [dispatch]);

    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") {
                return;
            }
            setOpenPath([]);
            dispatch(closeMobileTopMenu());
        };

        window.addEventListener("keydown", closeOnEscape);

        return () => {
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [dispatch]);

    useEffect(() => {
        if (!isMobileMenuOpen) {
            return;
        }

        firstMobileItemRef.current?.focus();
    }, [isMobileMenuOpen, mobilePath]);

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
                const hotKeyLabel =
                    typeof hotKeySequence === "string"
                        ? humanizeKeySequence(hotKeySequence)
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
        const currentItems = getItemsAtPath(menuBarItems, mobilePath);
        const currentLabel =
            mobilePath.length > 0
                ? getItemsAtPath(menuBarItems, mobilePath.slice(0, -1))[
                      mobilePath[mobilePath.length - 1]
                  ]?.label
                : "Menu";

        return (
            <>
                <button
                    type="button"
                    css={SS.mobileMenuButton}
                    aria-label="Toggle menu"
                    aria-haspopup="menu"
                    aria-controls="mobile-top-menu"
                    aria-expanded={isMobileMenuOpen}
                    onClick={() => {
                        dispatch(toggleMobileTopMenu());
                        if (isMobileMenuOpen) {
                            dispatch(resetMobileTopMenuPath());
                        }
                    }}
                >
                    <MenuIcon css={SS.mobileMenuIcon} />
                    <span>Menu</span>
                </button>
                {isMobileMenuOpen && (
                    <ul
                        id="mobile-top-menu"
                        role="menu"
                        css={SS.mobileDropdownList}
                    >
                        {mobilePath.length > 0 && (
                            <li
                                ref={firstMobileItemRef}
                                role="menuitem"
                                tabIndex={0}
                                css={SS.mobileBackItem}
                                onClick={() => {
                                    dispatch(popMobileTopMenuPath());
                                }}
                            >
                                <ArrowBackIcon css={SS.mobileBackIcon} />
                                <span>{currentLabel}</span>
                            </li>
                        )}

                        {currentItems.map((item, index) => {
                            if (item.seperator) {
                                return <hr key={index} css={hrCss} />;
                            }

                            const hasChild = !!item.submenu;

                            return (
                                <li
                                    key={index}
                                    ref={
                                        mobilePath.length === 0 && index === 0
                                            ? firstMobileItemRef
                                            : null
                                    }
                                    role="menuitem"
                                    tabIndex={0}
                                    css={
                                        item.disabled
                                            ? SS.listItemDisabled
                                            : SS.listItem
                                    }
                                    onClick={(event) => {
                                        if (item.disabled) {
                                            event.preventDefault();
                                            return;
                                        }

                                        if (hasChild) {
                                            dispatch(
                                                pushMobileTopMenuPath(index)
                                            );
                                            return;
                                        }

                                        runMenuItem(item, event);
                                    }}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === "Enter" ||
                                            event.key === " "
                                        ) {
                                            event.preventDefault();
                                            if (item.disabled) {
                                                return;
                                            }
                                            if (hasChild) {
                                                dispatch(
                                                    pushMobileTopMenuPath(index)
                                                );
                                                return;
                                            }
                                            runMenuItem(item);
                                        }
                                    }}
                                >
                                    {item.checked && (
                                        <SelectedIcon css={SS.selectedIcon} />
                                    )}
                                    <p css={SS.paraLabel}>{item.label}</p>
                                    {hasChild && (
                                        <NestedMenuIcon
                                            css={SS.nestedMenuIcon}
                                        />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
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
            <ul css={SS.root} ref={menuRootRef}>
                {mobileView ? mobileColumns() : columns(openPath)}
            </ul>
        </>
    );
}
