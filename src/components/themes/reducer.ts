import { Theme } from "@emotion/react";
import MonokaiTheme from "@styles/_theme-monokai";
import GitHubTheme from "@styles/_theme-github";
import { THEMES_CHANGE_THEME } from "./types";

export interface IThemeReducer {
    selectedTheme: Theme;
    selectedThemeName: string;
}

const initialState = {
    selectedTheme: MonokaiTheme as Theme,
    selectedThemeName: "monokai"
};

const ThemeReducer = (
    state: IThemeReducer,
    action: { newTheme?: string; type: string }
): IThemeReducer => {
    switch (action.type) {
        case THEMES_CHANGE_THEME: {
            switch (action.newTheme) {
                case "monokai": {
                    return {
                        selectedTheme: MonokaiTheme as Theme,
                        selectedThemeName: "monokai"
                    };
                }
                case "github": {
                    return {
                        selectedTheme: GitHubTheme as Theme,
                        selectedThemeName: "github"
                    };
                }
                default: {
                    return {
                        selectedTheme: MonokaiTheme as Theme,
                        selectedThemeName: "monokai"
                    };
                }
            }
        }

        default: {
            return state || initialState;
        }
    }
};

export default ThemeReducer;
