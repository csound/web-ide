export function isTabList(element) {
    return (
        element.type &&
        (element.type.displayName === "TabList" ||
            element.type.displayName === "DragTabList")
    );
}

export function isTab(element) {
    return (
        element.type &&
        (element.type.displayName === "Tab" ||
            element.type.displayName === "DragTab")
    );
}

export function isNumber(number) {
    return !Number.isNaN(Number.parseInt(number, 10));
}
