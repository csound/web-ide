export interface State {}

const INITIAL_STATE: State = {
    keyMap: {},
    keyHandlers: {}
};

export default (state = INITIAL_STATE, action: any) => {
    switch (action.type) {
        // case SET_MENU_BAR_HOTKEYS: {
        //     return {
        //         ...state
        //     };
        // }
        default: {
            return state;
        }
    }
};
