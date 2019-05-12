import { ITemplate } from "../db/interfaces";
import { merge } from "lodash";

const INITIAL_STATE: ITemplate = {
    fontFamily: "Roboto",
    fontSize: 0,
    theme: "dark",
};

export default (state = INITIAL_STATE, action: any) => {
    switch (action.type) {
        case "CHANGE_FONT_FAMILY": {
            return merge(state, { fontFamily: action.newFontFamily});
        }
        case "CHANGE_THEME": {
            return merge(state, { theme: action.newTheme });
        }
        case "CHANGE_FONT_SIZE": {
            return merge(state, { fontSize: action.newFontSize });
        }
        default: {
            return state;
        }
    }
};
