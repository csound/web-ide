import React, { useEffect, useRef, useState } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { useLocalStorage } from "react-use-storage";
import SelectedIcon from "@mui/icons-material/DoneSharp";
import NestedMenuIcon from "@mui/icons-material/ArrowRightSharp";
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
import {
    append,
    equals,
    isEmpty,
    path,
    pathOr,
    propOr,
    reduce,
    slice
} from "ramda";
import { showKeyboardShortcuts } from "@comp/site-documents/actions";
import { openBottomTab } from "@comp/bottom-tabs/actions";

export function MenuBar() {
    const setConsole = useSetConsole();
    const menuRootRef = useRef<HTMLUListElement | null>(null);

    const activeProjectUid: string = useSelector(
        pathOr("", ["ProjectsReducer", "activeProjectUid"])
    );

    const dispatch = useDispatch();
    const isOwner = useSelector(selectIsOwner);
    const csoundStatus = useSelector(selectCsoundStatus);
    const keyBindings: BindingsMap | undefined = useSelector(
        path(["HotKeysReducer", "bindings"])
    );

    const selectedThemeName: string | undefined = useSelector(
        path(["ThemeReducer", "selectedThemeName"])
    );

    const isManualOpen: boolean = useSelector((store) =>
        path(["ProjectEditorReducer", "manualVisible"], store)
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

    const [isSabEnabled, setIsSabEnabled] = useLocalStorage("sab", "false");

    const menuBarItems: MenuItemDef[] = [
        {
            label: "File",
            submenu: [
                {
                    label: "New File…",
                    hotKey: "new_document",
                    disabled: !isOwner
                },
                {
                    label: "Add File…",
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
                            callback: () => dispatch(changeTheme("default")),
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
                            callback: () => dispatch(changeTheme("dracula")),
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
                    label: csoundStatus === "paused" ? "Resume" : "Run/Play",
                    hotKey: "run_project",
                    disabled: csoundStatus === "playing"
                },
                {
                    label: "Stop",
                    hotKey: "stop_playback",
                    disabled:
                        csoundStatus !== "playing" && csoundStatus !== "paused"
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
                    callback: () => dispatch(openBottomTab("spectralAnalyzer")),
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
                // {
                //     label: "Refresh MIDI Input",
                //     callback: () => {
                //         dispatch(enableMidiInput());
                //     }
                // },
                // {
                //     label: "Refresh Audio Input",
                //     callback: () => {
                //         dispatch(enableAudioInput());
                //     }
                // },
                // {
                //     seperator: true
                // },
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
                        window.open("https://csound.com/docs/manual", "_blank");
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
    ];

    const [openPath, setOpenPath]: [number[], (p: number[]) => any] = useState(
        [] as number[]
    );

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
            const targetNode = event.target as Node | null;
            if (!targetNode) {
                return;
            }
            if (menuRootRef.current && !menuRootRef.current.contains(targetNode)) {
                setOpenPath([]);
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
    }, []);

    const reduceRow = (
        items: MenuItemDef[],
        openPath: number[],
        rowNesting: number[]
    ) =>
        reduce(
            (accumulator: React.ReactNode[], item: MenuItemDef) => {
                const index = accumulator.length;
                const thisRowNesting = append(index, rowNesting);
                const hasChild: boolean = item.submenu !== undefined;

                if (item.seperator) {
                    accumulator.push(<hr key={index} css={hrCss} />);
                } else {
                    accumulator.push(
                        <div
                            key={index}
                            onClick={(event) => {
                                if (item.disabled) {
                                    event.preventDefault();
                                    return;
                                }
                                if (item.hotKey) {
                                    invokeHotKeyCallback(item.hotKey);
                                } else {
                                    item.callback &&
                                        item.callback();
                                    event.preventDefault();
                                }
                            }}
                            css={hasChild && SS.nestedWrapper}
                            onMouseOver={() => {
                                setOpenPath(thisRowNesting);
                            }}
                        >
                            {hasChild &&
                                equals(
                                    thisRowNesting,
                                    (slice as any)(
                                        0,
                                        thisRowNesting.length,
                                        openPath
                                    )
                                ) && (
                                    <ul
                                        css={SS.dropdownListNested}
                                        style={{
                                            zIndex: thisRowNesting.length
                                        }}
                                        onMouseOver={(event) => {
                                            thisRowNesting.length >
                                                openPath.length &&
                                                setOpenPath(
                                                    append(
                                                        0,
                                                        (slice as any)(
                                                            0,
                                                            thisRowNesting.length,
                                                            openPath
                                                        )
                                                    )
                                                );
                                            event.stopPropagation();
                                        }}
                                    >
                                        {reduceRow(
                                            item.submenu || [],
                                            openPath,
                                            thisRowNesting
                                        )}
                                    </ul>
                                )}

                            <li
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
                                {item.hotKey &&
                                    keyBindings &&
                                    ((keyBindings as any)[
                                        item.hotKey
                                    ] as any) && (
                                        <i css={SS.paraLabel}>
                                            {humanizeKeySequence(
                                                propOr(
                                                    "",
                                                    item.hotKey,
                                                    keyBindings
                                                )
                                            )}
                                        </i>
                                    )}
                                {hasChild && (
                                    <NestedMenuIcon css={SS.nestedMenuIcon} />
                                )}
                            </li>
                        </div>
                    );
                }
                return accumulator;
            },
            [] as React.ReactNode[],
            items
        );

    const columns = (openPath: number[]) =>
        reduce(
            (accumulator: React.ReactNode[], item: MenuItemDef) => {
                const index = accumulator.length;
                // const openPath = openPath;
                const anyColIsOpen = !isEmpty(openPath);
                const thisColIsOpen =
                    !isEmpty(openPath) && equals(openPath[0], index);
                const row = (
                    <ul
                        style={{ display: thisColIsOpen ? "inline" : "none" }}
                        css={SS.dropdownList}
                    >
                        {!isEmpty(openPath) &&
                            !isEmpty(item.submenu) &&
                            reduceRow(item.submenu || [], openPath, [index])}
                    </ul>
                );
                accumulator.push(
                    <div
                        css={SS.dropdownButtonWrapper}
                        key={accumulator.length}
                        onClick={() => {
                            thisColIsOpen
                                ? setOpenPath([])
                                : setOpenPath([index]);
                        }}
                    >
                        <div
                            css={SS.dropdownButton}
                            onMouseOver={() =>
                                anyColIsOpen && setOpenPath([index])
                            }
                        >
                            <span>{item.label}</span>
                        </div>
                        {row}
                    </div>
                );
                return accumulator;
            },
            [] as React.ReactNode[],
            menuBarItems
        );

    return (
        <>
            <ul css={SS.root} ref={menuRootRef}>
                {columns(openPath)}
            </ul>
        </>
    );
}
