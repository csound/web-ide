import { IHotKeysCallbacks } from "@comp/hot-keys/types";

// type MenuItemType = "normal" | "separator";

export interface MenuItemDef {
    callback?: () => void;
    disabled?: boolean;
    doc?: string;
    checked?: boolean;
    hotKey?: keyof IHotKeysCallbacks;
    label?: string;
    seperator?: boolean;
    submenu?: MenuItemDef[];
}
