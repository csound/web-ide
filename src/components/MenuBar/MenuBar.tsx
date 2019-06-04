// MenuBar from https://codesandbox.io/s/94or0kq1o4
import * as React from "react";
import { useState } from "react";

import { sharedMenu } from "./Menu";
import { MenuItem } from "./MenuItem";

import "./styles/MenuBar.scss";

const className = "from-menu-bar";

interface Props {
    onPick(role: string): void;
    items: MenuItem[];
}

export function MenuBar({ items, onPick }: Props) {
    // This is a bitmask since menus can currently open/close out of sync.
    const [open, setOpen] = useState(0);

    const toggleMenu = async (e: React.MouseEvent, i: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (open & (1 << i)) {
            sharedMenu.close();
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const location = { x: rect.left - 2, y: rect.bottom };
        const within = document.body.getBoundingClientRect();
        Promise.resolve().then(() => {
            setOpen(o => o | (1 << i));
        });
        try {
            const menu = items[i].submenu;
            if (!menu) return;
            const selection = await sharedMenu.show(menu, {
                className,
                location,
                within,
            });
            if (selection.role) {
                onPick(selection.role);
            }
        } catch (e) {
        } finally {
            setOpen(o => o & ~(1 << i));
        }
    };

    // TODO: Prop that indicates a flashing menu bar item after a shortcut is used.
    return (
        <ul id="csound-menu-bar" className={open ? "active menu-bar" : "menu-bar"} onMouseDown={() => sharedMenu.close()}>
            {items.map((item, i) => (
                <li
                    key={i}
                    className={open & (1 << i) ? "open" : undefined}
                    onMouseDown={e => toggleMenu(e, i)}
                    onMouseOver={open && !(open & (1 << i)) ? e => toggleMenu(e, i) : undefined}
                >
                    {item.label}
                </li>
            ))}
        </ul>
    );
}
