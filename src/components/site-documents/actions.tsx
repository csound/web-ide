import { openSimpleModal } from "../modal/actions";

export const showKeyboardShortcuts = (): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch(openSimpleModal("keyboard-shortcuts", {}));
    };
};
