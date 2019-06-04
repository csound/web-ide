type MenuItemType = 'normal' | 'separator';

export interface MenuItemDef {
    accelerator?: string;
    checked?: boolean;
    enabled?: boolean;
    label?: string;
    mixed?: boolean;
    role?: string;
    submenu?: MenuItemDef[];
    type?: MenuItemType;
    visible?: boolean;
}

export class MenuItem {
    accelerator?: string;
    checked: boolean;
    enabled: boolean;
    label?: string;
    mixed: boolean;
    role?: string;
    submenu?: MenuItem[];
    type: MenuItemType;
    visible: boolean;

    static tree(defs: MenuItemDef[], fn?: (item: MenuItem) => void): MenuItem[] {
        return defs.map(def => {
            const item = new MenuItem(def);
            item.submenu = def.submenu && MenuItem.tree(def.submenu, fn);
            if (fn) fn(item);
            return item;
        });
    }

    constructor({
        accelerator,
        checked = false,
        enabled = true,
        label,
        mixed = false,
        role,
        type = 'normal',
        visible = true,
    }: MenuItemDef) {
        this.accelerator = accelerator;
        this.checked = checked;
        this.enabled = enabled;
        this.label = label;
        this.mixed = mixed;
        this.role = role;
        this.type = type;
        this.visible = visible;
    }

    get acceleratorLabel(): string {
        if (!this.accelerator) return '';
        // TODO: Windows support.
        const keys = this.accelerator.split('+');
        return keys
            .sort((a, b) => {
                const ai = acceleratorOrder.indexOf(a);
                const bi = acceleratorOrder.indexOf(b);
                if (ai !== -1 && bi !== -1) return ai - bi;
                if (ai !== -1) return -1;
                if (bi !== -1) return 1;
                return 0;
            })
            .map(key => {
                switch (key) {
                    case 'Backspace':
                    case 'Delete':
                        return '⌫';
                    case 'CommandOrControl':
                        return '⌘';
                    case 'Control':
                        return '⌃';
                    case 'Down':
                        return '↓';
                    case 'Enter':
                    case 'Return':
                        return '↩';
                    case 'Left':
                        return '←';
                    case '-':
                        return '–';
                    case 'Option':
                        return '⌥';
                    case 'Plus':
                        return '+';
                    case 'Right':
                        return '→';
                    case 'Shift':
                        return '⇧';
                    case 'Up':
                        return '↑';
                }
                return key;
            })
            .join('');
    }
}

const acceleratorOrder = ['Control', 'Option', 'Shift', 'CommandOrControl'];
