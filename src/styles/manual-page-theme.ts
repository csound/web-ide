import { manualColors } from "./manual-theme";
import { DEFAULT_THEME, normalizeThemeName, themes } from "./themes";

type ManualColors = ReturnType<typeof manualColors>;
const colorKeys = Object.keys(
    manualColors(themes[DEFAULT_THEME])
) as (keyof ManualColors)[];

/** Share the IDE's palette with the static page before its first paint. */
function applyTheme(mode: string, colors: Partial<ManualColors>) {
    document.documentElement.dataset.theme =
        mode === "light" ? "light" : "dark";
    for (const key of colorKeys) {
        const value = colors[key];
        if (typeof value === "string" && CSS.supports("color", value))
            document.documentElement.style.setProperty(`--${key}`, value);
    }
}

/** A standalone manual reads the same saved choice and default as the IDE. */
function applyStoredTheme() {
    let name = DEFAULT_THEME;
    try {
        name =
            normalizeThemeName(localStorage.getItem("theme")) || DEFAULT_THEME;
    } catch {
        // Use the global default when browser storage is unavailable.
    }
    const theme = themes[name];
    applyTheme(theme.mode, manualColors(theme));
}

applyStoredTheme();
window.addEventListener("storage", (event) => {
    if (event.key === "theme" || event.key === null) applyStoredTheme();
});
window.addEventListener("message", (event) => {
    if (
        parent === window ||
        event.origin !== location.origin ||
        event.source !== parent
    )
        return;
    if (event.data?.type === "csound-manual:theme")
        applyTheme(event.data.mode, event.data.colors || {});
});
