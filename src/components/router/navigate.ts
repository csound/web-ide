export const navigateTo = (path: string): void => {
    if (typeof window === "undefined") {
        return;
    }

    const currentPath =
        window.location.pathname +
        window.location.search +
        window.location.hash;

    if (currentPath === path) {
        return;
    }

    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
};
