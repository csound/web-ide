import React from "react";

export const closeModal = (): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: "MODAL_CLOSE"
        });
    };
};

export const setOnCloseModal = (
    onClose: () => void
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: "MODAL_SET_ON_CLOSE",
            onClose
        });
    };
};

export const openSimpleModal = (
    component: (properties: any) => React.ReactElement,
    properties: Record<string, any> | undefined
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: "MODAL_OPEN_SIMPLE",
            onClose: () => dispatch({ type: "MODAL_CLOSE" }),
            properties,
            component
        });
    };
};
