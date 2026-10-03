import { Theme } from "@emotion/react";
import { DEFAULT_THEME, normalizeThemeName, themes } from "@styles/themes";
import { UPDATE_USER_PROFILE } from "@comp/login/types";
import { CsoundTheme, THEMES_CHANGE_THEME } from "./types";

export interface IThemeReducer {
    selectedTheme: Theme;
    selectedThemeName: CsoundTheme;
}

const getThemeFromName = (themeName: CsoundTheme): Theme =>
    themes[themeName] as unknown as Theme;

function getInitialTheme(): IThemeReducer {
    const storedThemeName = normalizeThemeName(localStorage.getItem("theme"));
    const selectedThemeName: CsoundTheme = storedThemeName || DEFAULT_THEME;
    return {
        selectedTheme: getThemeFromName(selectedThemeName),
        selectedThemeName
    };
}

const initialState = getInitialTheme();

const ThemeReducer = (
    state: IThemeReducer | undefined,
    action: {
        newTheme?: string;
        type: string;
        profile?: { themeName?: string };
    }
): IThemeReducer => {
    if (!state) {
        return initialState;
    }

    switch (action.type) {
        case UPDATE_USER_PROFILE: {
            const themeFromProfile = normalizeThemeName(
                action.profile?.themeName
            );
            if (
                !themeFromProfile ||
                themeFromProfile === state.selectedThemeName
            ) {
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
                normalizeThemeName(action.newTheme) || DEFAULT_THEME;
            localStorage.setItem("theme", normalizedThemeName);
            return {
                selectedTheme: getThemeFromName(normalizedThemeName),
                selectedThemeName: normalizedThemeName
            };
        }

        default: {
            return state;
        }
    }
};

export default ThemeReducer;
