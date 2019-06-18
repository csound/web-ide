// MenuBar from https://codesandbox.io/s/94or0kq1o4
import * as React from "react";
import { useState } from "react";
import { sharedMenu } from "./Menu";
import { MenuItem } from "./MenuItem";
// import enhanceWithClickOutside from "react-click-outside";

import "./styles/MenuBar.scss";

const className = "from-menu-bar";

function useClickOutside(onClickOutside: (e: Event) => void) {
    const [domNode, setDomNode] = React.useState(null);

    React.useEffect(
        () => {
            const onClick = (e: Event) => {
                if ((!domNode || !(domNode as any)!.contains(e.target)) && onClickOutside)
                    onClickOutside(e);
            };

            document.addEventListener('click', onClick, true);
            return () => {
                document.removeEventListener('click', onClick, true);
            };
        },
        [domNode, onClickOutside]
    );

    const refCallback = React.useCallback(setDomNode, [onClickOutside]);

    return refCallback;
}


interface Props {
    onPick(role: string): void;
    items: MenuItem[];
}

export function MenuBar({ items, onPick }: Props) {
    // This is a bitmask since menus can currently open/close out of sync.
    const [open, setOpen] = useState(false) as any;

    const onClickOutside = React.useCallback((e) => {
        setOpen(false);
        sharedMenu.close();
    }, [setOpen]);

    const clickOutsideRef: any = useClickOutside(onClickOutside);

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
            ref={clickOutsideRef}
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
