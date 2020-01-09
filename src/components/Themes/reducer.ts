import { ITheme } from "@styles/types";
import MonokaiTheme from "@styles/_theme_monokai";
import BluePunkTheme from "@styles/_theme_bluepunk";
import { mergeAll } from "ramda";
import { THEMES_CHANGE_THEME } from "./types";

export interface IThemeReducer {
    selectedTheme: ITheme;
}

const initialState = {
    selectedTheme: MonokaiTheme as ITheme
};

export default (state: IThemeReducer, action: any) => {
    switch (action.type) {
        case THEMES_CHANGE_THEME: {
            switch (action.newTheme) {
                case "monokai": {
                    return mergeAll([state, { theme: MonokaiTheme as ITheme }]);
                }
                case "bluepunk": {
                    return mergeAll([
                        state,
                        { theme: BluePunkTheme as ITheme }
                    ]);
                }
                default: {
                    return mergeAll([state, { theme: MonokaiTheme as ITheme }]);
                }
            }
        }

        default: {
            return state || initialState;
        }
    }
};
