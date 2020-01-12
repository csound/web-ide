type MenuItemType = "normal" | "separator";

export interface MenuItemDef {
    callback?: () => void;
    doc?: string;
    checked?: boolean;
    hotKey?: string;
    label?: string;
    seperator?: boolean;
    submenu?: MenuItemDef[];
}
