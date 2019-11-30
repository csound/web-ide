import React, { useState } from "react";
import onClickOutside from "react-onclickoutside";
import IconButton from "@material-ui/core/IconButton";
import { PlayIcon } from "../../FontAudio";
// import { withShortcut, IShortcutProviderRenderProps } from "react-keybind";
import { useSelector, useDispatch } from "react-redux";
import useStyles from "./styles";
import * as SS from "./styles";
import { MenuItemDef } from "./interfaces";
import { IStore } from "../../db/interfaces";
import { isMac } from "../../utils";
import {
    newDocument,
    saveFile,
    exportProject,
    addDocument
} from "../Projects/actions";

import { toggleManualPanel } from "../ProjectEditor/actions";
import {
    runCsound,
    stopCsound,
    playPauseCsound,
    renderToDisk
} from "../Csound/actions";
import { reduce } from "lodash";
import { showKeyboardShortcuts } from "../SiteDocs/actions";

function MenuBar(props) {
    const activeProjectUid: string = useSelector((store: IStore) =>
        store.projects.activeProject
            ? store.projects.activeProject.projectUid
            : ""
    );

    const dispatch = useDispatch();

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
                    role: "hr"
                },
                {
                    label: "Close",
                    // keyBinding: isMac ? "⌘+s" : "ctrl+s",
                    role: "saveFile"
                },
                {
                    label: "Save and Close",
                    // keyBinding: isMac ? "⌘+s" : "ctrl+s",
                    role: "saveFile"
                },
                {
                    role: "hr"
                },
                {
                    label: "Export Project (.zip)",
                    callback: () => dispatch(exportProject()),
                    role: "export"
                }
            ]
        },
        {
            label: "Edit",
            submenu: [
                { label: "Undo", role: "doStuff" },
                { label: "Redo", role: "doStuff" }
            ]
        },
        {
            label: "Control",
            submenu: [
                {
                    label: "Run",
                    keyBinding: isMac ? "cmd+r" : "ctrl+r",
                    keyBindingLabel: isMac ? "⌘+r" : "ctrl+r",
                    role: "Run Csound",
                    callback: () => dispatch(runCsound())
                },
                {
                    label: "Stop",
                    // keyBinding: isMac ? "cmd+." : "ctrl+.",
                    // keyBindingLabel: isMac ? "⌘+." : "ctrl+.",
                    // role: "doStuff",
                    callback: () => dispatch(stopCsound())
                },
                {
                    label: "Pause",
                    keyBinding: isMac ? "cmd+p" : "ctrl+p",
                    keyBindingLabel: isMac ? "⌘+p" : "ctrl+p",
                    role: "doStuff",
                    callback: () => dispatch(playPauseCsound())
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

    const classes = useStyles();

    const [open, setOpen] = useState(false) as any;

    function reduceRow(items, nesting) {
        return reduce(
            items,
            (acc, item) => {
                const index = acc.length;
                const keyBinding = item.keyBinding;
                const itemCallback = item.callback;

                if (item.role === "hr") {
                    acc.push(<hr key={index} className={classes.hr} />);
                } else if (keyBinding && itemCallback) {
                    acc.push(
                        <li
                            className={classes.listItem}
                            key={index}
                            onClick={() => itemCallback()}
                        >
                            <p className={classes.label}>{item.label}</p>
                            <span style={{ width: 24 }} />
                            <i className={classes.label}>
                                {item.keyBindingLabel}
                            </i>
                        </li>
                    );
                } else if (itemCallback) {
                    acc.push(
                        <li
                            className={classes.listItem}
                            key={index}
                            onClick={() => itemCallback()}
                        >
                            <p className={classes.label}>{item.label}</p>
                        </li>
                    );
                } else {
                    acc.push(
                        <li className={classes.listItem} key={index}>
                            <p className={classes.label}>{item.label}</p>
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
                <li
                    css={SS.dropdownButton}
                    key={acc.length + open}
                    onClick={() =>
                        open !== false && index === open
                            ? setOpen(false)
                            : setOpen(index)
                    }
                    onMouseOver={() =>
                        open !== false && index !== open ? setOpen(index) : null
                    }
                >
                    {item.label}
                    {row}
                </li>
            );
            return acc;
        },
        [] as React.ReactNode[]
    );

    const buttonGroup = (
        <div css={SS.buttonGroup}>
            <IconButton
                type="button"
                classes={{ root: classes.iconButtonRoot }}
            >
                <PlayIcon size={32} />
            </IconButton>
        </div>
    );

    return (
        <>
            <ul className={classes.root}>{columns}</ul>
            {buttonGroup}
        </>
    );
}

const clickOutsideConfig = {
    excludeScrollbar: true,
    handleClickOutside: () => (MenuBar as any).handleClickOutside
};

// export default withShortcut(onClickOutside(MenuBar, clickOutsideConfig));
export default onClickOutside(MenuBar, clickOutsideConfig);
