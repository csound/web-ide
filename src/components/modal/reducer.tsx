import React from "react";
import { assoc } from "ramda";

export interface IModalReducer {
    isOpen: boolean;
    component: (properties: any) => React.ReactElement;
    properties: Record<string, any> | undefined;
    title?: string;
    onClose?: () => void;
}

const dummyComp = (): React.ReactElement => (
    <>
        <div />
    </>
);

const initialModalState: IModalReducer = {
    isOpen: false,
    component: dummyComp,
    properties: undefined
};

const ModalReducer = (
    state: IModalReducer,
    action: Record<string, any>
): IModalReducer => {
    switch (action.type) {
        case "MODAL_CLOSE": {
            return {
                isOpen: false,
                component: dummyComp,
                properties: undefined
            };
        }
        case "MODAL_SET_ON_CLOSE": {
            return assoc("onClose", action.onClose, state);
        }
        case "MODAL_OPEN_SIMPLE": {
            state.isOpen = true;
            state.component = action.component;
            state.onClose = action.onClose;
            state.properties = action.properties;
            return { ...state };
        }
        default: {
            return state || initialModalState;
        }
    }
};

export default ModalReducer;
