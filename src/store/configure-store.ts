import { Store, applyMiddleware, compose, createStore } from "redux";
import { IStore } from "./types";
import thunk from "redux-thunk";
import rootReducer from "./root-reducer";
import {
    developmentToolsActionSanitizer,
    developmentToolsStateSanitizer
} from "./devtools";
import { createReduxHistoryContext } from "redux-first-history";
import { History, createBrowserHistory } from "history";

// the manual as a dock is an iframe
// just to make the dev little faster
// we don't include the devtools
const insideIframe = !!window.frameElement;

interface ICreatedStore extends Store {
    getState: () => IStore;
}

// export const history: History = createBrowserHistory();

const { createReduxHistory, routerMiddleware, routerReducer } =
    createReduxHistoryContext({
        history: createBrowserHistory()
    });

export const configureStore = (): { store: Store; history: History } => {
    const composeEnhancer =
        !insideIframe &&
        typeof (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ===
            "function"
            ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
                  actionSanitizer: developmentToolsActionSanitizer,
                  stateSanitizer: developmentToolsStateSanitizer
              })
            : compose;

    const store: ICreatedStore = createStore(
        rootReducer({ routerReducer }),
        undefined,
        compose(composeEnhancer(applyMiddleware(routerMiddleware, thunk)))
    );

    const history = createReduxHistory(store);

    return { store, history };
};
