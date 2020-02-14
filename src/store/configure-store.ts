import { createStore, applyMiddleware, compose, Store } from "redux";
import { IStore } from "./types";
import thunk from "redux-thunk";
import rootReducer from "./RootReducer";
import { devToolsActionSanitizer, devToolsStateSanitizer } from "./devtools";
import { routerMiddleware } from "connected-react-router";
import { History, createBrowserHistory } from "history";

interface ICreatedStore extends Store {
    getState: () => IStore;
}

export const configureStore = () => {
    const history: History = createBrowserHistory();
    const composeEnhancer =
        (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
            actionSanitizer: devToolsActionSanitizer,
            stateSanitizer: devToolsStateSanitizer
        }) || compose;

    const store: ICreatedStore = createStore(
        rootReducer(history),
        compose(
            composeEnhancer(applyMiddleware(routerMiddleware(history), thunk))
        )
    );
    return { store, history };
};
