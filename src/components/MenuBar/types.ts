type MenuItemType = "normal" | "separator";

export interface MenuItemDef {
    callback?: () => void;
    disabled?: boolean;
    doc?: string;
    checked?: boolean;
    hotKey?: string;
    label?: string;
    seperator?: boolean;
    submenu?: MenuItemDef[];
}
