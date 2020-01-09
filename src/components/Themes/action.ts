import React from "react";
import { THEMES_CHANGE_THEME } from "./types";

export const changeTheme = (themeName: string) => {
    return async (dispatch: any) => {
        dispatch({
            type: THEMES_CHANGE_THEME,
            newTheme: themeName
        });
    };
};
