import { ITheme } from "@styles/types";
import MonokaiTheme from "@styles/_theme-monokai";
import GitHubTheme from "@styles/_theme-github";
import { THEMES_CHANGE_THEME } from "./types";

export interface IThemeReducer {
    selectedTheme: ITheme;
    selectedThemeName: string;
}

const initialState = {
    selectedTheme: MonokaiTheme as ITheme,
    selectedThemeName: "monokai"
};

const ThemeReducer = (state: IThemeReducer, action: any) => {
    switch (action.type) {
        case THEMES_CHANGE_THEME: {
            switch (action.newTheme) {
                case "monokai": {
                    return {
                        selectedTheme: MonokaiTheme,
                        selectedThemeName: "monokai"
                    };
                }
                case "github": {
                    return {
                        selectedTheme: GitHubTheme,
                        selectedThemeName: "github"
                    };
                }
                default: {
                    return {
                        selectedTheme: MonokaiTheme,
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
