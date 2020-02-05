import { ITheme } from "@styles/types";
import MonokaiTheme from "@styles/_theme_monokai";
import GitHubTheme from "@styles/_theme_github";
import BluePunkTheme from "@styles/_theme_bluepunk";
// import { mergeAll } from "ramda";
import { THEMES_CHANGE_THEME } from "./types";

export interface IThemeReducer {
    selectedTheme: ITheme;
    selectedThemeName: string;
}

const initialState = {
    selectedTheme: MonokaiTheme as ITheme,
    selectedThemeName: "monokai"
    // selectedTheme: GitHubTheme as ITheme,
    // selectedThemeName: "github"
};

export default (state: IThemeReducer, action: any) => {
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
                case "bluepunk": {
                    return {
                        selectedTheme: BluePunkTheme,
                        selectedThemeName: "bluepunk"
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
