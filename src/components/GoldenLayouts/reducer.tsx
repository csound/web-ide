import GoldenLayout from "golden-layout";

export interface IGoldenLayoutReducer {
    goldenLayout: GoldenLayout | null;
};

export default (state: IGoldenLayoutReducer, action: any) => {
    switch (action.type) {
        case "CREATE_INSTANCE": {
            return {
                goldenLayout: action.goldenLayout,
            };
        }
        case "DELETE_INSTANCE": {
            return {
                goldenLayout: null,
            };
        }
        default: {
            return {
                goldenLayout: null,
            };
        }
    }
}
