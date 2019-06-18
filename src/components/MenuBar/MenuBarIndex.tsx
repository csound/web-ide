// MenuBar: https://codesandbox.io/s/94or0kq1o4
import * as React from 'react';
import MenuBar from './MenuBar';
import { MenuItem, MenuItemDef } from './MenuItem';

import "./styles/index.css";

const menuBarDef: MenuItemDef[] = [
    {
        label: 'File',
        submenu: [
            { label: 'New File…', accelerator: 'CommandOrControl+N', role: 'createNewFile' },
            { label: 'New Project…', accelerator: 'CommandOrControl+Shift+N', role: 'createNewProject' },
        ],
    },

    { label: 'Selection1', submenu: [{ label: 'Do Stuff :)', role: 'doStuff' }] },
    { label: 'Selection2', submenu: [{ label: 'Do Stuff :)', role: 'doStuff' }] },
    { label: 'Selection3', submenu: [{ label: 'Do Stuff :)', role: 'doStuff' }] },
];

const menuBarItems = MenuItem.tree(menuBarDef);


export default class CsoundMenuBar extends React.Component<{}, {}> {
    public render() {
        return (
            <MenuBar
                items={menuBarItems}
                onPick={role => console.log(`You picked ${role}!`)}
            />
        )
    }
}
