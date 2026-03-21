import React from "react";
import { isMac } from "@root/utils";

type ShortcutRow = {
    shortcut: string;
    action: string;
};

const shortcutRows: ShortcutRow[] = [
    {
        shortcut: isMac ? "ctrl-command-n" : "ctrl-alt-n",
        action: "New file"
    },
    {
        shortcut: isMac ? "ctrl-command-u" : "ctrl-alt-u",
        action: "Add file(s)"
    },
    {
        shortcut: isMac ? "command-e" : "ctrl-e",
        action: "Evaluate current line"
    },
    {
        shortcut: isMac ? "command-enter" : "ctrl-enter",
        action: "Evaluate current block"
    },
    {
        shortcut: isMac ? "ctrl-." : "alt-.",
        action: "Show opcode documentation for opcode at cursor"
    },
    {
        shortcut: isMac ? "command-; / opt-command-;" : "ctrl-; / ctrl-shift-;",
        action: "Toggle comment"
    },
    {
        shortcut: isMac ? "command-s" : "ctrl-s",
        action: "Save current document"
    },
    {
        shortcut: isMac ? "opt-command-s" : "ctrl-shift-s",
        action: "Save all documents"
    },
    {
        shortcut: isMac ? "command-r" : "ctrl-r",
        action: "Run/Restart realtime rendering"
    },
    {
        shortcut: isMac ? "command-p" : "ctrl-p",
        action: "Pause realtime rendering"
    }
];

export const KeyboardShortcuts = () => (
    <div>
        <h3>Editor Actions</h3>
        <table>
            <thead>
                <tr>
                    <th>Shortcut</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {shortcutRows.map(({ shortcut, action }) => (
                    <tr key={action}>
                        <td>{shortcut}</td>
                        <td>{action}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
