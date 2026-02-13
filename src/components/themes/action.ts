// import React from "react";
import { doc, updateDoc } from "firebase/firestore";
import { profiles } from "@config/firestore";
import { RootState } from "@root/store";
import { CsoundTheme, THEMES_CHANGE_THEME } from "./types";

export const changeTheme = (
    themeName: CsoundTheme
): ((dispatch: any, getState: () => RootState) => Promise<void>) => {
    return async (dispatch: any, getState: () => RootState) => {
        dispatch({
            type: THEMES_CHANGE_THEME,
            newTheme: themeName
        });

        const loggedInUid = getState().LoginReducer.loggedInUid;
        if (loggedInUid) {
            try {
                await updateDoc(doc(profiles, loggedInUid), {
                    themeName
                });
            } catch (error) {
                console.error("Failed to persist theme to profile", error);
            }
        }
    };
};
