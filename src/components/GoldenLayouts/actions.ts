import GoldenLayout from "golden-layout";
import { IPanel } from "./interfaces";
import { find } from "lodash";
import { store } from "../../store";

export const createGoldenLayoutInstance = (goldenLayout: GoldenLayout) => {
    return async (dispatch: any) => {
        dispatch({
            type: "CREATE_INSTANCE",
            goldenLayout,
        })
    }
}

export const storeGoldenLayoutPanels = (panels: IPanel[]) => {
    return async (dispatch: any) => {
        dispatch({
            type: "GOLDEN_LAYOUT_STORE_PANELS",
            panels,
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

// DOES NOT RETURN DISPATCH!
export const openTab = (goldenLayout: GoldenLayout, fileName: string) => {

    if (goldenLayout) {
        const tabItem = goldenLayout.root.getItemsById(fileName);
        if (tabItem.length > 0) {
            tabItem[0].parent.setActiveContentItem(tabItem[0]);
        } else {
            const tabStack = goldenLayout.root.getItemsById("tabstack");
            if (tabStack && tabStack.length > 0) {
                const storeState = store.getState();
                const restoreTab = find(storeState.GoldenLayoutReducer.goldenLayoutPanels, (panel) => {
                    return panel.id === fileName;
                });
                console.log(tabStack, restoreTab);

                // const newTab =  {
                //     component: "Editor",
                //     type: "react-component",
                //     panelTitle: document.name,
                //     title: document.name,
                //     id: document.name,
                //     props: {
                //         savedValue: document.savedValue,
                //         documentIndex: index,
                //         projectIndex: activeProject,
                //     },
                // }
                // console.log(tabStack[0].addChild, tabStack);
                // tabStack[0].addChild(restoreTab, tabStack[0].contentItems.length);
            }
            // console.log(tabStack);
        }
    }
}
