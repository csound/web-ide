import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import * as serviceWorker from "./service-worker";
import Main from "./components/main/main";

// import * as Sentry from "@sentry/browser";

import "./config/firestore"; // import for sideffects
import "react-perfect-scrollbar/dist/css/styles.css";
import "react-loader-spinner/dist/loader/css/CradleLoader.css";
import "react-loader-spinner/dist/loader/css/Plane.css";
import "react-loader-spinner/dist/loader/css/Triangle.css";

// (window as any).React = React;
// (window as any).ReactDOM = ReactDOM;

// if (typeof process.env.REACT_APP_SENTRY_DSN !== "undefined") {
//     Sentry.init({
//         dsn: process.env.REACT_APP_SENTRY_DSN
//     });
// }

// class WithSentry extends React.Component<any> {
//     componentDidCatch(error, errorInfo) {
//         if (typeof process.env.REACT_APP_SENTRY_DSN !== "undefined") {
//             Sentry.withScope((scope) => {
//                 Object.keys(errorInfo).forEach((key) => {
//                     scope.setExtra(key, errorInfo[key]);
//                 });
//                 Sentry.captureException(error);
//             });
//         }
//     }
//     render() {
//         return this.props.children;
//     }
// }

// INITIALIZE FIREBASE AND FIRESTORE
// This is done through the import of config/firestore

// INITIALIZE REACT RENDERING
ReactDOM.render(
    <Provider store={store}>
        <Main />
    </Provider>,
    document.querySelector("#root")
);

serviceWorker.unregister();
