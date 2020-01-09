import React, { useState } from "react";
import onClickOutside from "react-onclickoutside";
import { useSelector, useDispatch } from "react-redux";
import * as SS from "./styles";
import { MenuItemDef } from "./interfaces";
import { isMac } from "@root/utils";
import {
    newDocument,
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
import { pathOr } from "ramda";
import { reduce } from "lodash";
import { getPlayActionFromTarget } from "@comp/TargetControls/utils";
import { showKeyboardShortcuts } from "@comp/SiteDocs/actions";
// import { changeTheme } from "@comp/Themes/action";

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
                    keyBinding: isMac ? null : "ctrl+alt+n",
                    keyBindingLabel: isMac ? null : "ctrl+alt+n",
                    callback: () => dispatch(newDocument(activeProjectUid, ""))
                },
                {
                    label: "Add File…",
                    role: "add file from filesystem",
                    callback: () => dispatch(addDocument(activeProjectUid))
                },
                {
                    label: "Save Document",
                    keyBinding: isMac ? "alt+y" : "ctrl+s",
                    keyBindingLabel: isMac ? "⌘+s" : "ctrl+s",
                    callback: () => {
                        dispatch(saveFile());
                    },
                    role: "saveFile"
                },
                {
                    label: "Save All",
                    keyBinding: isMac ? "opt+cmd+s" : "ctrl+shift+s",
                    keyBindingLabel: isMac ? "⌥+⌘+s" : "ctrl+shift+s",
                    callback: () => {
                        dispatch(saveFile());
                    },
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
                    submenu: [{ label: "BluePunk", role: "doStuff" }]
                }
            ]
        },
        {
            label: "Project",
            submenu: [
                {
                    label: "Run",
                    keyBinding: isMac ? "cmd+r" : "ctrl+r",
                    keyBindingLabel: isMac ? "⌘+r" : "ctrl+r",
                    role: "Run Csound",
                    callback: () => dispatch(playAction)
                },
                {
                    label: "Stop",
                    callback: () => dispatch(stopCsound())
                },
                {
                    label: "Pause",
                    keyBinding: isMac ? "cmd+p" : "ctrl+p",
                    keyBindingLabel: isMac ? "⌘+p" : "ctrl+p",
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
                    role: "toggleManual",
                    callback: () => dispatch(toggleManualPanel())
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
        setOpen(false);
    };

    const [open, setOpen] = useState(false) as any;

    function reduceRow(items, nesting) {
        return reduce(
            items,
            (acc, item) => {
                const index = acc.length;
                const keyBinding = item.keyBinding;
                const itemCallback = item.callback;

                if (item.role === "hr") {
                    acc.push(<hr key={index} css={SS.hr} />);
                } else if (keyBinding && itemCallback) {
                    acc.push(
                        <li
                            css={SS.listItem}
                            key={index}
                            onClick={() => itemCallback()}
                        >
                            <p css={SS.paraLabel}>{item.label}</p>
                            <span style={{ width: 24 }} />
                            <i css={SS.paraLabel}>{item.keyBindingLabel}</i>
                        </li>
                    );
                } else if (itemCallback) {
                    acc.push(
                        <li
                            css={SS.listItem}
                            key={index}
                            onClick={() => itemCallback()}
                        >
                            <p css={SS.paraLabel}>{item.label}</p>
                        </li>
                    );
                } else {
                    acc.push(
                        <li css={SS.listItem} key={index}>
                            <p css={SS.paraLabel}>{item.label}</p>
                        </li>
                    );
                }
                return acc;
            },
            [] as React.ReactNode[]
        );
    }

    const columns = reduce(
        menuBarItems,
        (acc, item) => {
            const index = acc.length;
            const row = (
                <ul
                    style={{ display: open === index ? "inline" : "none" }}
                    css={SS.dropdownList}
                >
                    {reduceRow(item.submenu, 0)}
                </ul>
            );
            acc.push(
                <div
                    css={SS.dropdownButtonWrapper}
                    key={acc.length + open}
                    onClick={e => {
                        open !== false && index === open
                            ? setOpen(false)
                            : setOpen(index);
                    }}
                >
                    <div
                        css={SS.dropdownButton}
                        onMouseOver={() =>
                            open !== false && index !== open
                                ? setOpen(index)
                                : null
                        }
                    >
                        <span>{item.label}</span>
                    </div>
                    {row}
                </div>
            );
            return acc;
        },
        [] as React.ReactNode[]
    );

    return (
        <>
            <ul css={SS.root}>{columns}</ul>
        </>
    );
}

const clickOutsideConfig = {
    excludeScrollbar: true,
    handleClickOutside: () => (MenuBar as any).handleClickOutside
};

// export default withShortcut(onClickOutside(MenuBar, clickOutsideConfig));
export default onClickOutside(MenuBar, clickOutsideConfig);
