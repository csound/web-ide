import React from "react";
import { Provider } from "react-redux";
import { createStore, applyMiddleware, compose } from "redux";
import ReduxThunk from "redux-thunk";
import { routerMiddleware, syncHistoryWithStore } from "react-router-redux";
import reducers from "./reducers";
import firebase from "firebase";
import Router from "./router/Router";
import createHistory from "history/createBrowserHistory";
import config from "./config.json";
import "./App.css";
import CsoundComponent from "./components/CsoundComponent";

import { getAllData } from "./actions";

const App = () => {
    require("firebase/firestore");

    firebase.initializeApp(config.firebase);
    const firestore = firebase.firestore();
    const settings = { timestampsInSnapshots: true };
    firestore.settings(settings);
    document.title = config.title;
    const browserHistory = createHistory();

    const enhancer = compose(
        applyMiddleware(ReduxThunk, routerMiddleware(browserHistory)),
        window.devToolsExtension ? window.devToolsExtension() : f => f
    );
    const store = createStore(reducers, {}, enhancer);
    syncHistoryWithStore(browserHistory, store);

    store.dispatch(getAllData());
    return (
        <CsoundComponent>
            <Provider store={store}>
                <Router history={browserHistory} />
            </Provider>
        </CsoundComponent>
    );
};

export default App;
