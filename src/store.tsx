import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
import rootReducer from "./RootReducer";
import { routerMiddleware } from "connected-react-router";
import { History, createBrowserHistory } from "history";

const configureStore = () => {
    const history: History = createBrowserHistory();
    const composeEnhancer =
        (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

    const store = createStore(
        rootReducer(history),
        compose(
            composeEnhancer(applyMiddleware(routerMiddleware(history), thunk))
        )
    );
    return { store, history };
};


export const { store, history } = configureStore();
