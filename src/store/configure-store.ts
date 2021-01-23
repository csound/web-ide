import { createStore, applyMiddleware, compose, Store } from "redux";
import { IStore } from "./types";
import thunk from "redux-thunk";
import rootReducer from "./root-reducer";
import {
    developmentToolsActionSanitizer,
    developmentToolsStateSanitizer
} from "./devtools";
import { routerMiddleware } from "connected-react-router";
import { History, createBrowserHistory } from "history";

interface ICreatedStore extends Store {
    getState: () => IStore;
}

export const history: History = createBrowserHistory();

export const configureStore = (): { store: Store; history: History } => {
    const composeEnhancer =
        typeof (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ===
        "function"
            ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
                  actionSanitizer: developmentToolsActionSanitizer,
                  stateSanitizer: developmentToolsStateSanitizer
              })
            : compose;

    const store: ICreatedStore = createStore(
        rootReducer(history),
        undefined,
        compose(
            composeEnhancer(applyMiddleware(routerMiddleware(history), thunk))
        )
    );
    return { store, history };
};
