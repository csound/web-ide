import React from "react";
import ReactDOM from "react-dom";
import Main from "./components/Main/Main";
import registerServiceWorker from "./registerServiceWorker";
import configureStore from "./configureStore";
import { Provider } from "react-redux";

const { store, history } = configureStore();

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
