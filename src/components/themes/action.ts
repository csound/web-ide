// import React from "react";
import { CsoundTheme, THEMES_CHANGE_THEME } from "./types";

export const changeTheme = (
    themeName: CsoundTheme
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: THEMES_CHANGE_THEME,
            newTheme: themeName
        });
    };
};
