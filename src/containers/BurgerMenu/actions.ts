
export const toggleBurgerMenu = () => {
    return async (dispatch: any) => {
        dispatch({
            type: "BURGER_MENU_TOGGLE",
        })
    }
}

export const setOpenState = (isOpen: boolean) => {
    return async (dispatch: any) => {
        dispatch({
            type: "BURGER_MENU_SET_STATE",
            isOpen,
        })
    }
}
