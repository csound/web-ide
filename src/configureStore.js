import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import rootReducer from "./RootReducer";
import { connectRouter, routerMiddleware } from "connected-react-router";
import { createBrowserHistory } from "history";

const configureStore = () => {
    const history = createBrowserHistory();

    const store = createStore(
        rootReducer(history),
        applyMiddleware(routerMiddleware(history), thunk)
    );

    if (module.hot) {
        // Enable Webpack hot module replacement for reducers
        module.hot.accept("./", () => {
            let nextRootReducer = require("./RootReducer").default;
            store.replaceReducer(nextRootReducer);
        });
    }
    return { store, history };
};

export default configureStore;
