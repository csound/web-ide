import { IBurgerMenu } from "../../db/interfaces";

const INITIAL_STATE: IBurgerMenu = {
    isOpen: false,
};

export default (state = INITIAL_STATE, action: any) => {
    switch (action.type) {
        case "BURGER_MENU_TOGGLE": {
            return {
                isOpen: !state.isOpen
            };
        }
        case "BURGER_MENU_SET_STATE": {
            return {
                isOpen: action.isOpen,
            };
        }
        default: {
            return state;
        }
    }
};
