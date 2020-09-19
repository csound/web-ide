import React from "react";

export const closeModal = () => {
    return async (dispatch: any) => {
        dispatch({
            type: "MODAL_CLOSE"
        });
    };
};

export const setOnCloseModal = (onClose: () => void) => {
    return async (dispatch: any) => {
        dispatch({
            type: "MODAL_SET_ON_CLOSE",
            onClose
        });
    };
};

export const openSimpleModal = (component: React.FC) => {
    return async (dispatch: any) => {
        dispatch({
            type: "MODAL_OPEN_SIMPLE",
            onClose: () => dispatch({ type: "MODAL_CLOSE" }),
            component
        });
    };
};
