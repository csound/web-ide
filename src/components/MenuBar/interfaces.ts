type MenuItemType = "normal" | "separator";

export interface MenuItemDef {
    callback?: () => void;
    checked?: boolean;
    enabled?: boolean;
    hotKey?: string;
    keyBinding?: string | null;
    keyBindingLabel?: string | null;
    label?: string;
    mixed?: boolean;
    role?: string;
    submenu?: MenuItemDef[];
    type?: MenuItemType;
    visible?: boolean;
}
