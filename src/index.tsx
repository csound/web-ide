import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { store, history } from "./store";
import registerServiceWorker from "./registerServiceWorker";
import Main from "./components/Main/Main";
import "./css/filemenu.css"
import "./css/index.css";

(window as any).React = React;
(window as any).ReactDOM = ReactDOM;
(window as any).$ = require("jquery");

ReactDOM.render(
    <Provider store={store}>
        <Main history={history} />
    </Provider>,
    document.getElementById("root")
);

if ((module as any).hot) {
    (module as any).hot.accept("./components/Main/Main", () => {
        ReactDOM.render(
            <Provider store={store}>
                <Main history={history} />
            </Provider>,
            document.getElementById("root")
        );
    });
}
registerServiceWorker();
