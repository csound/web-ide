import React, { useCallback, useState } from "react";
import onClickOutside from "react-onclickoutside";
import { useSelector, useDispatch } from "react-redux";
import * as SS from "./styles";
import { MenuItemDef } from "./interfaces";
// import { isMac } from "@root/utils";
import {
    newDocument,
    saveFile,
    exportProject,
    addDocument
} from "@comp/Projects/actions";
// import { toggleManualPanel } from "@comp/ProjectEditor/actions";
import {
    stopCsound,
    playPauseCsound,
    renderToDisk
} from "@comp/Csound/actions";
import { getPlayActionFromTarget } from "@comp/TargetControls/utils";
import { append, equals, isEmpty, pathOr, reduce, slice } from "ramda";
import { showKeyboardShortcuts } from "@comp/SiteDocs/actions";

function MenuBar(props) {
    const activeProjectUid: string = useSelector(
        pathOr("", ["ProjectsReducer", "activeProjectUid"])
    );

    const dispatch = useDispatch();

    const playAction = useSelector(getPlayActionFromTarget);

    const menuBarItems: MenuItemDef[] = [
        {
            label: "File",
            submenu: [
                {
                    label: "New File…",
                    role: "creates new document",
                    hotKey: "new_document",
                    callback: () => dispatch(newDocument(activeProjectUid, ""))
                },
                {
                    label: "Add File…",
                    role: "add file from filesystem",
                    callback: () => dispatch(addDocument(activeProjectUid))
                },
                {
                    label: "Save Document",
                    // keyBinding: isMac ? "alt+y" : "ctrl+s",
                    // keyBindingLabel: isMac ? "⌘+s" : "ctrl+s",
                    // eslint-disable-next-line
                    callback: () => useCallback(dispatch(saveFile()), []),
                    role: "saveFile"
                },
                {
                    label: "Save All",
                    // keyBinding: isMac ? "opt+cmd+s" : "ctrl+shift+s",
                    // keyBindingLabel: isMac ? "⌥+⌘+s" : "ctrl+shift+s",
                    // eslint-disable-next-line
                    callback: useCallback(() => dispatch(saveFile()), []),
                    role: "saveAll"
                },
                {
                    role: "hr"
                },
                {
                    label: "Render to Disk and Download",
                    callback: () => dispatch(renderToDisk()),
                    role: "renderToDisk"
                },
                {
                    label: "Export Project (.zip)",
                    callback: () => dispatch(exportProject()),
                    role: "export"
                },
                {
                    role: "hr"
                },
                {
                    label: "Save and Close",
                    // keyBinding: isMac ? "⌘+s" : "ctrl+s",
                    role: "saveFile"
                }
            ]
        },
        {
            label: "Edit",
            submenu: [
                { label: "Undo", role: "doStuff" },
                { label: "Redo", role: "doStuff" },
                {
                    label: "Theme",
                    submenu: [
                        {
                            label: "BluePunk",
                            role: "doStuff",
                            submenu: [
                                { label: "TEST1", role: "" },
                                {
                                    label: "TEST2",
                                    role: "",
                                    submenu: [
                                        {
                                            label: "Undo",
                                            role: "doStuff",
                                            submenu: [
                                                {
                                                    label: "Undo",
                                                    role: "doStuff",
                                                    submenu: [
                                                        {
                                                            label: "Undo",
                                                            role: "doStuff"
                                                        },
                                                        {
                                                            label: "Redo",
                                                            role: "doStuff"
                                                        }
                                                    ]
                                                },
                                                {
                                                    label:
                                                        "VAR FYRIR NE?ANN EN NUNA?"
                                                }
                                            ]
                                        },
                                        { label: "Redo", role: "doStuff" }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            label: "Project",
            submenu: [
                {
                    label: "Run",
                    // keyBinding: isMac ? "cmd+r" : "ctrl+r",
                    // keyBindingLabel: isMac ? "⌘+r" : "ctrl+r",
                    role: "Run Csound",
                    callback: () => dispatch(playAction)
                },
                {
                    label: "Stop",
                    callback: () => dispatch(stopCsound())
                },
                {
                    label: "Pause",
                    // keyBinding: isMac ? "cmd+p" : "ctrl+p",
                    // keyBindingLabel: isMac ? "⌘+p" : "ctrl+p",
                    role: "doStuff",
                    callback: () => dispatch(playPauseCsound())
                },
                {
                    role: "hr"
                },
                {
                    label: "Configure Targets",
                    role: "toggle-project-configure"
                }
            ]
        },
        {
            label: "Help",
            submenu: [
                {
                    label: "Csound Manual",
                    role: "toggleManual"
                    // callback: () => dispatch(toggleManualPanel())
                },
                {
                    label: "Csound Manual (External)",
                    role: "openCsoundManual",
                    callback: () => {
                        window.open("https://csound.com/docs/manual", "_blank");
                    }
                },
                {
                    label: "Csound FLOSS Manual",
                    role: "openCsoundFLOSSManual",
                    callback: () => {
                        window.open(
                            "https://csound-floss.firebaseapp.com/",
                            "_blank"
                        );
                    }
                },
                {
                    role: "hr"
                },
                {
                    label: "Web-IDE Documentation",
                    role: "open WebIDE Documentation",
                    callback: () => {
                        window.open("/documentation", "_blank");
                    }
                },
                {
                    role: "hr"
                },
                {
                    label: "Show Keyboard Shortcuts",
                    role: "showKeyboardShortcuts",
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

                if (item.role === "hr") {
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
                                <p css={SS.paraLabel}>{item.label}</p>
                                {item.keyBindingLabel && (
                                    <i css={SS.paraLabel}>
                                        {item.keyBindingLabel}
                                    </i>
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
