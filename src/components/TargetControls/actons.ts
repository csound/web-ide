import { SET_SELECTED_TARGET } from "./types";

export const setSelectedTarget = (selectedTarget: string) => {
    return async (dispatch: any) => {
        dispatch({
            type: SET_SELECTED_TARGET,
            selectedTarget
        });
    };
};
