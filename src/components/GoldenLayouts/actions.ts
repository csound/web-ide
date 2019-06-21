import GoldenLayout from "golden-layout";

export const createGoldenLayoutInstance = (goldenLayout: GoldenLayout) => {
    return async (dispatch: any) => {
        dispatch({
            type: "CREATE_INSTANCE",
            goldenLayout,
        })
    }
}

export const deleteGoldenLayoutInstance = () => {
    return async (dispatch: any) => {
        dispatch({
            type: "DELETE_INSTANCE",
        })
    }
}
