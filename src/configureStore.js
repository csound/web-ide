import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
import rootReducer from "./RootReducer";
import { connectRouter, routerMiddleware } from "connected-react-router";
import { createBrowserHistory } from "history";

const configureStore = () => {
    const history = createBrowserHistory();
    const composeEnhancer =
        window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

    const store = createStore(
        rootReducer(history),
        compose(
            composeEnhancer(applyMiddleware(routerMiddleware(history), thunk))
        )
    );
    return { store, history };
};

export default configureStore;
