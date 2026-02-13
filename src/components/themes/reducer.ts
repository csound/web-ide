import { Theme } from "@emotion/react";
import MonokaiTheme from "@styles/_theme-monokai";
import GitHubTheme from "@styles/_theme-github";
import GitHubLightTheme from "@styles/_theme-github-light";
import DraculaTheme from "@styles/_theme-dracula";
import NordTheme from "@styles/_theme-nord";
import SolarizedDarkTheme from "@styles/_theme-solarized-dark";
import { UPDATE_USER_PROFILE } from "@comp/login/types";
import { CsoundTheme, THEMES_CHANGE_THEME } from "./types";

export interface IThemeReducer {
    selectedTheme: Theme;
    selectedThemeName: CsoundTheme;
}

const LEGACY_THEME_MAP: Record<string, CsoundTheme> = {
    monokai: "default",
    github: "github",
    "github-light": "github-light",
    default: "default",
    dracula: "dracula",
    nord: "nord",
    "solarized-dark": "solarized-dark"
};

const normalizeThemeName = (
    themeName: string | undefined | null
): CsoundTheme | undefined => {
    if (!themeName) {
        return undefined;
    }
    return LEGACY_THEME_MAP[themeName];
};

const getThemeFromName = (themeName: CsoundTheme): Theme => {
    switch (themeName) {
        case "github": {
            return GitHubTheme as unknown as Theme;
        }
        case "github-light": {
            return GitHubLightTheme as unknown as Theme;
        }
        case "dracula": {
            return DraculaTheme as unknown as Theme;
        }
        case "nord": {
            return NordTheme as unknown as Theme;
        }
        case "solarized-dark": {
            return SolarizedDarkTheme as unknown as Theme;
        }
        case "default":
        default: {
            return MonokaiTheme as unknown as Theme;
        }
    }
};

function getInitialTheme(): IThemeReducer {
    const storedThemeName = normalizeThemeName(localStorage.getItem("theme"));
    const selectedThemeName: CsoundTheme = storedThemeName || "default";
    return {
        selectedTheme: getThemeFromName(selectedThemeName),
        selectedThemeName
    };
}

const initialState = getInitialTheme();

const ThemeReducer = (
    state: IThemeReducer | undefined,
    action: { newTheme?: string; type: string; profile?: { themeName?: string } }
): IThemeReducer => {
    if (!state) {
        return initialState;
    }

    switch (action.type) {
        case UPDATE_USER_PROFILE: {
            const themeFromProfile = normalizeThemeName(action.profile?.themeName);
            if (!themeFromProfile || themeFromProfile === state.selectedThemeName) {
                return state;
            }
            localStorage.setItem("theme", themeFromProfile);
            return {
                selectedTheme: getThemeFromName(themeFromProfile),
                selectedThemeName: themeFromProfile
            };
        }
        case THEMES_CHANGE_THEME: {
            const normalizedThemeName =
                normalizeThemeName(action.newTheme) || "default";
            localStorage.setItem("theme", normalizedThemeName);
            return {
                selectedTheme: getThemeFromName(normalizedThemeName),
                selectedThemeName: normalizedThemeName
            }
        }

        default: {
            return state;
        }
    }
};

export default ThemeReducer;
