import React from "react";
import { openSimpleModal } from "../modal/actions";

export const showKeyboardShortcuts = () => {
    return async (dispatch: any) => {
        const shortcuts = () => (
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
                        <tr>
                            <td>ctrl-e</td>
                            <td>Evaluate current line</td>
                        </tr>
                        <tr>
                            <td>ctrl-enter</td>
                            <td>Evaluate current block</td>
                        </tr>
                        <tr>
                            <td>ctrl-.</td>
                            <td>
                                Show opcode documentation for opcode at cursor
                            </td>
                        </tr>
                        <tr>
                            <td>ctrl-;</td>
                            <td>Toggle comment</td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>ctrl-s</td>
                            <td>Save current document</td>
                        </tr>
                        <tr>
                            <td>shift-ctrl-s</td>
                            <td>Save all documents</td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>ctrl-r</td>
                            <td>Run/Restart realtime rendering</td>
                        </tr>
                        <tr>
                            <td>ctrl-p</td>
                            <td>Pause realtime rendering</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
        dispatch(openSimpleModal(shortcuts));
    };
};
