import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App/App";
import registerServiceWorker from "./registerServiceWorker";
import configureStore from "./configureStore";
import { Provider } from "react-redux";

const { store, history } = configureStore();

ReactDOM.render(
    <Provider store={store}>
        <App history={history} />
    </Provider>,
    document.getElementById("root")
);

if (module.hot) {
    module.hot.accept("./App/App", () => {
        ReactDOM.render(
            <Provider store={store}>
                <App history={history} />
            </Provider>,
            document.getElementById("root")
        );
    });
}
registerServiceWorker();
