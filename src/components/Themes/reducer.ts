import { ITheme } from "@styles/types";
import MonokaiTheme from "@styles/_theme_monokai";
import { merge } from "lodash";

export interface IThemeReducer {
    selectedTheme: ITheme;
}

const initialState = {
    selectedTheme: MonokaiTheme as ITheme
};

export default (state: ITheme | undefined, action: any) => {
    switch (action.type) {
        // case "CHANGE_FONT_FAMILY": {
        //     return merge(state, { fontFamily: action.newFontFamily });
        // }
        case "CHANGE_THEME": {
            return merge(state, { theme: action.newTheme });
        }
        // case "CHANGE_FONT_SIZE": {
        //     return merge(state, { fontSize: action.newFontSize });
        // }
        default: {
            return state || initialState;
        }
    }
};
