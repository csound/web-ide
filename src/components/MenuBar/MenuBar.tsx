import React, { useState } from "react";
import onClickOutside from "react-onclickoutside";
import { useSelector, useDispatch } from "react-redux";
import SelectedIcon from "@material-ui/icons/DoneSharp";
import NestedMenuIcon from "@material-ui/icons/ArrowRightSharp";
import * as SS from "./styles";
import { MenuItemDef } from "./types";
import { BindingsMap } from "@comp/HotKeys/types";
import { humanizeKeySequence } from "@comp/HotKeys/utils";
import {
    newDocument,
    saveAllAndClose,
    saveAllFiles,
    saveFile,
    exportProject,
    addDocument
} from "@comp/Projects/actions";
import { toggleManualPanel } from "@comp/ProjectEditor/actions";
import {
    stopCsound,
    playPauseCsound,
    renderToDisk
} from "@comp/Csound/actions";
import { changeTheme } from "@comp/Themes/action";
import { getPlayActionFromTarget } from "@comp/TargetControls/utils";
import { append, equals, isEmpty, pathOr, propOr, reduce, slice } from "ramda";
import { showKeyboardShortcuts } from "@comp/SiteDocs/actions";

function MenuBar(props) {
    const activeProjectUid: string = useSelector(
        pathOr("", ["ProjectsReducer", "activeProjectUid"])
    );

    const dispatch = useDispatch();

    const playAction = useSelector(getPlayActionFromTarget);
    const keyBindings: BindingsMap | null = useSelector(
        pathOr(null, ["HotKeysReducer", "bindings"])
    );

    const selectedThemeName: string | null = useSelector(
        pathOr(null, ["ThemeReducer", "selectedThemeName"])
    );

    const menuBarItems: MenuItemDef[] = [
        {
            label: "File",
            submenu: [
                {
                    label: "New File…",
                    hotKey: "new_document",
                    callback: () => dispatch(newDocument(activeProjectUid, ""))
                },
                {
                    label: "Add File…",
                    hotKey: "add_file",
                    callback: () => dispatch(addDocument(activeProjectUid))
                },
                {
                    label: "Save Document",
                    hotKey: "save_document",
                    callback: () => dispatch(saveFile())
                },
                {
                    label: "Save All",
                    hotKey: "save_all_documents",
                    callback: () => dispatch(saveAllFiles())
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
                    label: "Save and Close",
                    hotKey: "save_and_close",
                    callback: () => dispatch(saveAllAndClose("/profile"))
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
                            label: "BluePunk",
                            callback: () => dispatch(changeTheme("bluepunk")),
                            checked: selectedThemeName === "bluepunk"
                        }
                    ]
                }
            ]
        },
        {
            label: "Project",
            submenu: [
                {
                    label: "Run/Play",
                    hotKey: "run_project",
                    callback: () => dispatch(playAction)
                },
                {
                    label: "Stop",
                    hotKey: "stop_playback",
                    callback: () => dispatch(stopCsound())
                },
                {
                    label: "Pause",
                    hotKey: "pause_playback",
                    callback: () => dispatch(playPauseCsound())
                },
                {
                    seperator: true
                },
                {
                    label: "Configure Targets"
                }
            ]
        },
        {
            label: "Help",
            submenu: [
                {
                    label: "Csound Manual",
                    callback: () => dispatch(toggleManualPanel())
                },
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
                    acc.push(<hr key={index} css={SS.hr} />);
                } else {
                    acc.push(
                        <div
                            key={index}
                            onClick={e => {
                                item.callback && item.callback();
                                e.preventDefault();
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

                            <li css={SS.listItem}>
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
