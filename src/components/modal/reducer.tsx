import { assoc, pipe } from "ramda";

export interface IModalReducer {
    isOpen: boolean;
    properties: Record<string, any> | undefined;
    title?: string;
    modalComponentName?: string;
}

const initialModalState: IModalReducer = {
    isOpen: false,
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
                properties: undefined
            };
        }
        case "MODAL_SET_ON_CLOSE": {
            return assoc("onClose", action.onClose, state);
        }
        case "MODAL_OPEN_SIMPLE": {
            return pipe(
                assoc("isOpen", true),
                assoc("properties", action.properties),
                assoc("modalComponentName", action.modalComponentName)
            )(state);
        }
        default: {
            return state || initialModalState;
        }
    }
};

export default ModalReducer;
