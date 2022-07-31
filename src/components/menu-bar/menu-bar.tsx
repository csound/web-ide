import React, { useState } from "react";
import onClickOutside from "react-onclickoutside";
import { useSelector, useDispatch } from "react-redux";
import { useLocalStorage } from "react-use-storage";
import SelectedIcon from "@material-ui/icons/DoneSharp";
import NestedMenuIcon from "@material-ui/icons/ArrowRightSharp";
import * as SS from "./styles";
import { hr as hrCss } from "@styles/_common";
import { MenuItemDef } from "./types";
import { useSetConsole } from "@comp/console/context";
import { invokeHotKeyCallback } from "@comp/hot-keys/actions";
import { BindingsMap } from "@comp/hot-keys/types";
import { humanizeKeySequence } from "@comp/hot-keys/utils";
import { showTargetsConfigDialog } from "@comp/target-controls/actions";
import { IStore } from "@store/types";
import { exportProject } from "@comp/projects/actions";
import {
    toggleManualPanel,
    setFileTreePanelOpen
} from "@comp/project-editor/actions";
import {
    renderToDisk,
    enableMidiInput,
    enableAudioInput
} from "@comp/csound/actions";
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

function MenuBar(): JSX.Element {
    const setConsole = useSetConsole();

    const activeProjectUid: string = useSelector(
        pathOr("", ["ProjectsReducer", "activeProjectUid"])
    );

    const dispatch = useDispatch();
    const isOwner = useSelector(selectIsOwner(activeProjectUid));
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

    const isConsoleVisible = useSelector((store: IStore) =>
        (store.BottomTabsReducer.openTabs || []).includes("console")
    );

    const isFileTreeVisible = useSelector(
        (store: IStore) => store.ProjectEditorReducer.fileTreeVisible
    );

    const isSpectralAnalyzerVisible = useSelector((store: IStore) =>
        store.BottomTabsReducer.openTabs.includes("spectralAnalyzer")
    );

    const isMidiPianoVisible = useSelector((store: IStore) =>
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
                            label: "Monokai",
                            callback: () => dispatch(changeTheme("monokai")),
                            checked: selectedThemeName === "monokai"
                        },
                        {
                            label: "Github",
                            callback: () => dispatch(changeTheme("github")),
                            checked: selectedThemeName === "github"
                        }
                        // {
                        //     label: "BluePunk",
                        //     callback: () => dispatch(changeTheme("bluepunk")),
                        //     checked: selectedThemeName === "bluepunk"
                        // }
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
                {
                    label: "Refresh MIDI Input",
                    callback: () => {
                        dispatch(enableMidiInput());
                    }
                },
                {
                    label: "Refresh Audio Input",
                    callback: () => {
                        dispatch(enableAudioInput());
                    }
                },
                {
                    seperator: true
                },
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

    (MenuBar as any).handleClickOutside = (event_) => {
        setOpenPath([]);
    };

    const [openPath, setOpenPath]: [number[], (p: number[]) => any] = useState(
        [] as number[]
    );

    const reduceRow = (items, openPath: number[], rowNesting: number[]) =>
        reduce(
            (accumulator: React.ReactNode[], item: MenuItemDef) => {
                const index = accumulator.length;
                const thisRowNesting = append(index, rowNesting);
                const hasChild: boolean = typeof item.submenu !== "undefined";

                if (item.seperator) {
                    accumulator.push(<hr key={index} css={hrCss} />);
                } else {
                    accumulator.push(
                        <div
                            key={index}
                            onClick={(event) => {
                                if (item.hotKey) {
                                    dispatch(invokeHotKeyCallback(item.hotKey));
                                } else {
                                    item.callback &&
                                        !item.disabled &&
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
                                            item.submenu,
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
                                    keyBindings[item.hotKey] && (
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

    const columns = (openPath) =>
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
                            reduceRow(item.submenu, openPath, [index])}
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
            <ul css={SS.root}>{columns(openPath)}</ul>
        </>
    );
}

const clickOutsideConfig = {
    excludeScrollbar: true,
    handleClickOutside: () => (MenuBar as any).handleClickOutside
};

export default onClickOutside(MenuBar, clickOutsideConfig) as any as React.FC;
