// MenuBar: https://codesandbox.io/s/94or0kq1o4
import { MenuItem } from "./MenuItem";
import "./styles/Menu.scss";

// Close if mouse is held down longer than this (ms).
const closeOnReleaseThreshold = 500;

export enum CloseBehavior {
    /** Immediately fade out. */
    Immediate,
    /** Fade out after a small delay. */
    Delayed,
    /** Disappear instantly. */
    NoAnimation,
}

interface Selection {
    path: number[];
    role?: string;
}

interface MenuInstanceOptions {
    className?: string;
}

enum MenuState {
    Initial,
    Open,
    Closing,
    Closed,
}

interface PositionOptions {
    location: { x: number; y: number };
    within: { bottom: number; left: number; right: number; top: number };
}

export class Menu {
    private active?: MenuInstance;
    private activePromise?: Promise<Selection>;

    async close(behavior = CloseBehavior.Immediate) {
        if (!this.active) return;
        return this.active.close(behavior);
    }

    async show(
        items: MenuItem[],
        { className, location, within }: MenuInstanceOptions & PositionOptions,
    ): Promise<Selection> {
        if (this.active) {
            if (this.active.items === items) {
                if (!this.activePromise) throw Error("Invalid state");
                this.active.position({ location, within });
                return this.activePromise;
            } else {
                await this.active.close(CloseBehavior.NoAnimation);
            }
        }

        this.active = new MenuInstance(items, { className });
        this.activePromise = this.active.show({ location, within });

        const cleanUp = () => {
            this.active = undefined;
            this.activePromise = undefined;
        };
        this.activePromise.then(cleanUp, cleanUp);

        return this.activePromise;
    }
}

/**
 * A single instance that be used to avoid more
 * than one menu showing on screen at once.
 */
export const sharedMenu = new Menu();

class MenuInstance implements EventListenerObject {
    items: MenuItem[];

    blocker: HTMLDivElement;
    root: HTMLUListElement;

    constructor(items: MenuItem[], { className }: MenuInstanceOptions) {
        this.items = items;

        this.blocker = createBlocker();
        this.root = createRoot(items, className);
    }

    async close(behavior: CloseBehavior, selection?: Selection) {
        if (!this.blocker.parentNode || !this.root.parentNode) {
            throw Error("Elements not in DOM");
        }
        if (this.state !== MenuState.Open) {
            throw Error(`Menu not in Open state (${this.state})`);
        }
        const { resolve, reject } = this;
        if (!resolve || !reject) throw Error("Invalid internal state");
        this.state = MenuState.Closing;
        // TODO: Ensure only one close is happening.
        // TODO: Immediately resolve/reject promise if behavior is NoAnimation.
        document.body.removeChild(this.blocker);
        if (behavior === CloseBehavior.Immediate || behavior === CloseBehavior.Delayed) {
            await this.fadeOut(behavior !== CloseBehavior.Delayed);
        }
        this.state = MenuState.Closed;
        document.body.removeChild(this.root);
        if (selection) {
            resolve(selection);
        } else {
            reject();
        }
    }

    handleEvent(e: Event) {
        switch (e.type) {
            case "animationend":
                if ((e as AnimationEvent).animationName === "menu-active-item") {
                    // The reason we do it this way is so that we can track hovers from a mouse event
                    // that starts inside an iframe. Normally JavaScript cannot know about these
                    // events, but CSS animations do trigger events so we can use that instead.
                    this.setActiveLI(e.target instanceof HTMLLIElement ? e.target : null);
                }
                break;
            case "contextmenu":
                e.preventDefault();
                e.stopPropagation();
                // TODO: Replicate the right click in Vekter.
                if (e.target === this.blocker && Date.now() - this.showTime > closeOnReleaseThreshold) {
                    this.close(CloseBehavior.Immediate);
                }
                break;
            case "mousedown":
                this.mouseDownTime = Date.now();
                if (e.target === this.blocker) {
                    this.close(CloseBehavior.Immediate);
                }
                break;
            case "mouseout":
                if (e.currentTarget === this.root) {
                    this.setActiveLI(null);
                }
                break;
            case "mouseover":
                if (e.target instanceof HTMLLIElement) {
                    this.setActiveLI(e.target);
                }
                break;
            case "mouseup":
                if (e.target === this.blocker) {
                    // Only close if the menu wasn"t just opened.
                    if (Date.now() - this.showTime > closeOnReleaseThreshold) {
                        this.close(CloseBehavior.Immediate);
                    }
                } else {
                    this.pick();
                }
                break;
        }
    }

    position({ location: { x, y }, within: { bottom, top, left, right } }: PositionOptions) {
        if (!this.root.parentNode) throw Error("Menu not in DOM");
        if (this.state !== MenuState.Open) {
            throw Error(`Menu not in Open state (${this.state})`);
        }
        // TODO: Early exit if values did not change.
        const { root } = this;
        root.style.left = `${left + x + 2}px`;
        root.style.top = `${top + y}px`;
        // Don"t let the menu go off screen.
        const rect = root.getBoundingClientRect();
        if (rect.right + 5 >= right) {
            root.style.left = `${right - rect.width - 5}px`;
        }
        // TODO: Max height.
        if (rect.bottom + 5 >= bottom) {
            root.style.top = `${bottom - rect.height - 5}px`;
        }
        // Make submenus expand in direction with space.
        // TODO: Deeper nesting?
        if (rect.right + rect.width * 2 > right) {
            root.classList.add("expand-left");
        }
        Array.from(root.querySelectorAll("li.submenu > ul")).forEach(subUL => {
            const subRect = subUL.getBoundingClientRect();
            if (subRect.bottom + 5 >= bottom) subUL.classList.add("expand-up");
        });
    }

    async show(position: PositionOptions): Promise<Selection> {
        if (this.root.parentNode) throw Error("Menu already in DOM");
        if (this.state !== MenuState.Initial) {
            throw Error(`Menu not in Initial state (${this.state})`);
        }

        this.state = MenuState.Open;
        const { blocker, root } = this;

        document.body.appendChild(blocker);
        blocker.addEventListener("mousedown", this);
        blocker.addEventListener("mouseup", this);
        blocker.addEventListener("contextmenu", this);

        document.body.appendChild(root);
        root.addEventListener("animationend", this);
        root.addEventListener("contextmenu", this);
        root.addEventListener("mousedown", this);
        root.addEventListener("mouseout", this);
        root.addEventListener("mouseover", this);
        root.addEventListener("mouseup", this);

        this.position(position);

        this.mouseDownTime = this.showTime = Date.now();

        return new Promise<Selection>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    private activeLI: HTMLLIElement | null = null;
    private mouseDownTime = 0;
    private reject?: () => void;
    private resolve?: (selection: Selection) => void;
    private showTime = 0;
    private state = MenuState.Initial;

    private async fadeOut(withoutDelay = false) {
        return animateWithClass(this.root, {
            className: withoutDelay ? "disappearing-immediate" : "disappearing",
            animationName: "menu-disappearing",
        });
    }

    private async pick() {
        // TODO: Only allow pick once.
        if (!this.activeLI || !isPickable(this.activeLI)) {
            if (Date.now() - this.mouseDownTime > closeOnReleaseThreshold) {
                // The mouse button was held down a long time so close the menu.
                this.close(CloseBehavior.Immediate);
            }
            return;
        }
        const { path, role } = this.activeLI.dataset;
        if (!path) throw Error("Path missing in menu item");
        await animateWithClass(this.activeLI, {
            className: "picked",
            animationName: "menu-picked",
        });
        await this.close(CloseBehavior.Delayed, {
            path: path.split(",").map(n => parseInt(n, 10)),
            role,
        });
    }

    private setActiveLI(li: HTMLLIElement | null) {
        // Safari doesn"t do CSS hover on drag over, so we use a CSS class for this.
        if (this.activeLI) this.activeLI.classList.remove("hover");
        if (li) li.classList.add("hover");
        this.activeLI = li;
    }
}

interface AnimateWithClassOptions {
    className: string;
    animationName: string;
}

/** Adds a CSS class to an element and waits for the triggered animation to complete. */
async function animateWithClass(element: HTMLElement, { className, animationName }: AnimateWithClassOptions) {
    if (!element.parentNode) throw Error("Element is not in DOM");
    // TODO: This promise should be rejected if element is removed from DOM.
    const promise = new Promise<void>(resolve => {
        const listener = (e: AnimationEvent) => {
            if (e.target !== element || e.animationName !== animationName) return;
            element.removeEventListener("animationend", listener);
            resolve();
        };
        element.addEventListener("animationend", listener);
    });
    element.classList.add(className);
    return promise;
}

function createBlocker() {
    const div = document.createElement("div");
    div.id = "menu-blocker";
    div.style.position = "absolute";
    div.style.bottom = "0";
    div.style.left = "0";
    div.style.right = "0";
    div.style.top = "0";
    return div;
}

function createItem(path: number[], item: MenuItem) {
    if (!item.visible) return null;
    if (item.type === "separator" && path[path.length - 1] === 0) {
        // Vekter sometimes requests a separator at the top but it shouldn"t be visible.
        return null;
    }
    const li = document.createElement("li");
    li.classList.add(item.type);
    if (!item.enabled) li.classList.add("disabled");
    if (item.submenu) li.classList.add("submenu");
    if (item.enabled) {
        li.dataset.path = path.join(",");
        if (item.role) li.dataset.role = item.role;
    }
    if (item.label) {
        const labelSpan = document.createElement("span");
        labelSpan.classList.add("label");
        labelSpan.textContent = item.label;
        li.appendChild(labelSpan);
        if (item.accelerator) {
            const aSpan = document.createElement("span");
            aSpan.classList.add("accelerator");
            const keyString = item.acceleratorLabel;
            const lastIndex = keyString.length - 1;
            const aSpan1 = document.createElement("span");
            aSpan1.textContent = keyString.substring(0, lastIndex);
            aSpan.appendChild(aSpan1);
            const aSpan2 = document.createElement("span");
            aSpan2.textContent = keyString.substring(lastIndex);
            aSpan.appendChild(aSpan2);
            li.appendChild(aSpan);
        }
    }
    if (item.enabled && item.submenu) {
        const ul = document.createElement("ul");
        for (let i = 0; i < item.submenu.length; i++) {
            const subitem = item.submenu[i];
            const subli = createItem(path.concat([i]), subitem);
            if (!subli) continue;
            ul.appendChild(subli);
        }
        li.appendChild(ul);
    }
    return li;
}

function createRoot(items: MenuItem[], className?: string) {
    const ul = document.createElement("ul");
    ul.id = "menu";
    if (className) {
        ul.classList.add(className);
    }
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const li = createItem([i], item);
        if (!li) continue;
        ul.appendChild(li);
    }
    return ul;
}

function isPickable(li: HTMLLIElement) {
    if (li.classList.contains("disabled")) return false;
    if (li.classList.contains("submenu")) return false;
    return true;
}
