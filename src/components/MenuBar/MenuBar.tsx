import React, { useState } from "react";
import onClickOutside from "react-onclickoutside";
import { useSelector, useDispatch } from "react-redux";
import SelectedIcon from "@material-ui/icons/DoneSharp";
import NestedMenuIcon from "@material-ui/icons/ArrowRightSharp";
import * as SS from "./styles";
import { hr as hrCss } from "@styles/_common";
import { MenuItemDef } from "./types";
import { invokeHotKeyCallback } from "@comp/HotKeys/actions";
import { BindingsMap } from "@comp/HotKeys/types";
import { humanizeKeySequence } from "@comp/HotKeys/utils";
import { showTargetsConfigDialog } from "@comp/TargetControls/actions";
import { IStore } from "@store/types";
import { exportProject } from "@comp/Projects/actions";
import {
    toggleManualPanel,
    setConsolePanelOpen,
    setFileTreePanelOpen
} from "@comp/ProjectEditor/actions";
import { renderToDisk } from "@comp/Csound/actions";
import { selectCsoundStatus } from "@comp/Csound/selectors";
import { selectIsOwner } from "@comp/ProjectEditor/selectors";
import { changeTheme } from "@comp/Themes/action";
import { append, equals, isEmpty, pathOr, propOr, reduce, slice } from "ramda";
import { showKeyboardShortcuts } from "@comp/SiteDocs/actions";

function MenuBar(props) {
    const activeProjectUid: string = useSelector(
        pathOr("", ["ProjectsReducer", "activeProjectUid"])
    );

    const dispatch = useDispatch();
    const isOwner = useSelector(selectIsOwner(activeProjectUid));
    const csoundStatus = useSelector(selectCsoundStatus);
    const keyBindings: BindingsMap | null = useSelector(
        pathOr(null, ["HotKeysReducer", "bindings"])
    );

    const selectedThemeName: string | null = useSelector(
        pathOr(null, ["ThemeReducer", "selectedThemeName"])
    );

    const isManualOpen: boolean = useSelector(
        store =>
            pathOr(null, ["ProjectEditorReducer", "secondaryPanel"], store) ===
            "manual"
    );

    const isConsoleVisible = useSelector(
        (store: IStore) => store.ProjectEditorReducer.consoleVisible
    );

    const isFileTreeVisible = useSelector(
        (store: IStore) => store.ProjectEditorReducer.fileTreeVisible
    );

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
                    label: "Render to Disk and Download",
                    callback: () => dispatch(renderToDisk())
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
                { label: "Undo" },
                { label: "Redo" },
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
                    callback: () =>
                        dispatch(setConsolePanelOpen(!isConsoleVisible)),
                    checked: isConsoleVisible
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
                            "https://csound-floss.firebaseapp.com/",
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

    (MenuBar as any).handleClickOutside = evt => {
        setOpenPath([]);
    };

    const [openPath, setOpenPath]: [number[], (p: number[]) => any] = useState(
        [] as number[]
    );

    const reduceRow = (items, openPath: number[], rowNesting: number[]) =>
        reduce(
            (acc: React.ReactNode[], item: MenuItemDef) => {
                const index = acc.length;
                const thisRowNesting = append(index, rowNesting);
                const hasChild: boolean = typeof item.submenu !== "undefined";

                if (item.seperator) {
                    acc.push(<hr key={index} css={hrCss} />);
                } else {
                    acc.push(
                        <div
                            key={index}
                            onClick={e => {
                                if (item.hotKey) {
                                    dispatch(invokeHotKeyCallback(item.hotKey));
                                } else {
                                    item.callback &&
                                        !item.disabled &&
                                        item.callback();
                                    e.preventDefault();
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
                                        onMouseOver={e => {
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
                                            e.stopPropagation();
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
                return acc;
            },
            [] as React.ReactNode[],
            items
        );

    const columns = openPath =>
        reduce(
            (acc: React.ReactNode[], item: MenuItemDef) => {
                const index = acc.length;
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
                acc.push(
                    <div
                        css={SS.dropdownButtonWrapper}
                        key={acc.length}
                        onClick={e => {
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
                return acc;
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

// export default withShortcut(onClickOutside(MenuBar, clickOutsideConfig));
export default onClickOutside(MenuBar, clickOutsideConfig);
