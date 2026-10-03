import MonokaiTheme from "./_theme-monokai";
import GitHubTheme from "./_theme-github";
import GitHubLightTheme from "./_theme-github-light";
import DraculaTheme from "./_theme-dracula";
import NordTheme from "./_theme-nord";
import SolarizedDarkTheme from "./_theme-solarized-dark";
import type { CsoundTheme } from "../components/themes/types";

export const DEFAULT_THEME: CsoundTheme = "default";
export const themes = {
    default: MonokaiTheme,
    github: GitHubTheme,
    "github-light": GitHubLightTheme,
    dracula: DraculaTheme,
    nord: NordTheme,
    "solarized-dark": SolarizedDarkTheme
};

/** Read current and older saved theme names without changing the default. */
export function normalizeThemeName(
    name: string | undefined | null
): CsoundTheme | undefined {
    if (name === "monokai") return DEFAULT_THEME;
    return name && Object.hasOwn(themes, name)
        ? (name as CsoundTheme)
        : undefined;
}
