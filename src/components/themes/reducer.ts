import { Theme } from "@emotion/react";
import MonokaiTheme from "@styles/_theme-monokai";
import GitHubTheme from "@styles/_theme-github";
import { CsoundTheme, THEMES_CHANGE_THEME } from "./types";

export interface IThemeReducer {
    selectedTheme: Theme;
    selectedThemeName: CsoundTheme;
}

function getInitialTheme(): IThemeReducer {
    const storedThemeName = localStorage.getItem("theme");
    if (
        typeof storedThemeName === "string" &&
        ["monokai", "github"].includes(storedThemeName)
    ) {
        switch (storedThemeName) {
            case "monokai": {
                return {
                    selectedTheme: MonokaiTheme as unknown as Theme,
                    selectedThemeName: "monokai"
                };
            }
            case "github": {
                return {
                    selectedTheme: GitHubTheme as unknown as Theme,
                    selectedThemeName: "github"
                };
            }
            default: {
                return {
                    selectedTheme: MonokaiTheme as unknown as Theme,
                    selectedThemeName: "monokai"
                };
            }
        }
    } else {
        return {
            selectedTheme: MonokaiTheme as unknown as Theme,
            selectedThemeName: "monokai"
        };
    }
}

const initialState = getInitialTheme();

const ThemeReducer = (
    state: IThemeReducer,
    action: { newTheme?: string; type: string }
): IThemeReducer => {
    switch (action.type) {
        case THEMES_CHANGE_THEME: {
            localStorage.setItem("theme", action.newTheme || "");
            switch (action.newTheme) {
                case "monokai": {
                    return {
                        selectedTheme: MonokaiTheme as unknown as Theme,
                        selectedThemeName: "monokai"
                    };
                }
                case "github": {
                    return {
                        selectedTheme: GitHubTheme as unknown as Theme,
                        selectedThemeName: "github"
                    };
                }
                default: {
                    return {
                        selectedTheme: MonokaiTheme as unknown as Theme,
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
