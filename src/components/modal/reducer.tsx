import React from "react";
import { assoc } from "ramda";

export interface IModalReducer {
    isOpen: boolean;
    component: React.ReactElement;
    title?: string;
    onClose?: () => void;
}

const dummyComp = () => <div />;

const initialModalState: IModalReducer = {
    isOpen: false,
    component: dummyComp
};

const ModalReducer = (
    state: IModalReducer,
    action: Record<string, any>
): IModalReducer => {
    switch (action.type) {
        case "MODAL_CLOSE": {
            return { isOpen: false, component: dummyComp };
        }
        case "MODAL_SET_ON_CLOSE": {
            return assoc("onClose", action.onClose, state);
        }
        case "MODAL_OPEN_SIMPLE": {
            state.isOpen = true;
            state.component = action.component;
            state.onClose = action.onClose;
            return { ...state };
        }
        default: {
            return state || initialModalState;
        }
    }
};

export default ModalReducer;
