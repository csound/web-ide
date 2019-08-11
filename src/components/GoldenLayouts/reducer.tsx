import GoldenLayout from "golden-layout";
import { IPanel } from "./interfaces";

export interface IGoldenLayoutReducer {
    goldenLayout: GoldenLayout | null;
    goldenLayoutPanels: IPanel[] | null;
};

export default (state: IGoldenLayoutReducer, action: any) => {
    switch (action.type) {
        case "CREATE_INSTANCE": {
            return {
                goldenLayoutPanels: (state && state.goldenLayoutPanels) || null,
                goldenLayout: action.goldenLayout,
            };
        }
        case "DELETE_INSTANCE": {
            return {
                goldenLayoutPanels: null,
                goldenLayout: null,
            };
        }
        case "GOLDEN_LAYOUT_STORE_PANELS": {
            state.goldenLayoutPanels = action.panels;
            return {...state};
        }
        default: {
            return state || {
                goldenLayoutPanels: null,
                goldenLayout: null,
            };
        }
    }
}
