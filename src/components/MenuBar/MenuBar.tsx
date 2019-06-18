// MenuBar from https://codesandbox.io/s/94or0kq1o4
import * as React from "react";
import { useState } from "react";
import { sharedMenu } from "./Menu";
import { MenuItem } from "./MenuItem";
import onClickOutside from "react-onclickoutside";

import "./styles/MenuBar.scss";

const className = "from-menu-bar";

interface Props {
    onPick(role: string): void;
    items: MenuItem[];
}

function MenuBar({ items, onPick }: Props) {
    // This is a bitmask since menus can currently open/close out of sync.
    const [open, setOpen] = useState(false) as any;

    (MenuBar as any).handleClickOutside = () => {
        setOpen(false);
        sharedMenu.close();
    }

    const openMenu = async (e: React.MouseEvent, i: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (open && (open === i)) {
            if (e.type === "mousedown") {
                setOpen((o: any) => false);
                sharedMenu.close();
            }
            return;
        }
        sharedMenu.close();
        const rect = e.currentTarget.getBoundingClientRect();
        const location = { x: rect.left - 2, y: rect.bottom };
        const within = document.body.getBoundingClientRect();

        setTimeout(setOpen((open: any) => i), 10);

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
            // console.log("ERROR", e)
        } finally {
            // setOpen((o: any) => false);
        }
    };

    // TODO: Prop that indicates a flashing menu bar item after a shortcut is used.
    return (
        <ul
            id="csound-menu-bar"
            className={open ? "active menu-bar" : "menu-bar"}
            onMouseDown={() => sharedMenu.close()}
        >
            {items.map((item, i) => (
                <li
                    key={i}
                    className={open === i ? "open" : undefined}
                    onMouseDown={e => openMenu(e, i)}
                    onMouseOver={e => (open !== false && openMenu(e, i))}
                >
                    {item.label}
                </li>
            ))}
        </ul>
    );
}

const clickOutsideConfig = {
    handleClickOutside: () => (MenuBar as any).handleClickOutside
};

export default onClickOutside(MenuBar, clickOutsideConfig);
