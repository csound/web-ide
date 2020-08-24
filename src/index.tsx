import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { store, history } from "./store";
import * as serviceWorker from "./serviceWorker";
import Main from "./components/Main/Main";
import { setCsound, setCsoundPlayState } from "./components/Csound/actions";
import CsoundObj from "./components/Csound/CsoundObj";
import { ICsoundObj } from "./components/Csound/types";
import * as Sentry from "@sentry/browser";
// import "./css/index.css";
import "./config/firestore"; // import for sideffects
import "react-perfect-scrollbar/dist/css/styles.css";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";

(window as any).React = React;
(window as any).ReactDOM = ReactDOM;

if (typeof process.env.REACT_APP_SENTRY_DSN !== "undefined") {
    Sentry.init({
        dsn: process.env.REACT_APP_SENTRY_DSN
    });
}

class WithSentry extends React.Component<any> {
    componentDidCatch(error, errorInfo) {
        if (typeof process.env.REACT_APP_SENTRY_DSN !== "undefined") {
            Sentry.withScope(scope => {
                Object.keys(errorInfo).forEach(key => {
                    scope.setExtra(key, errorInfo[key]);
                });
                Sentry.captureException(error);
            });
        }
    }
    render() {
        return this.props.children;
    }
}

// INITIALIZE FIREBASE AND FIRESTORE
// This is done through the import of config/firestore

// INITIALIZE REACT RENDERING
ReactDOM.render(
    <WithSentry>
        <Provider store={store}>
            <Main history={history} />
        </Provider>
    </WithSentry>,
    document.getElementById("root")
);

serviceWorker.unregister();

// ADD LISTENING TO REDUX STORE FOR SYNCHRONIZING PROJECT FILES TO EMFS
CsoundObj.importScripts("/csound/").then(() => {
    // const state = store.getState()
    // console.log("STORE STATE", setCsound);
    const csound: ICsoundObj = new CsoundObj();
    store.dispatch(setCsound(csound));
    csound.setMessageCallback(() => {});
    csound.addPlayStateListener(csObj => {
        // console.log("Csound playState changed: " + csObj.getPlayState());
        store.dispatch(setCsoundPlayState(csObj.getPlayState()));
    });
});
