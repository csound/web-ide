import React from "react";
import ReactDOM from "react-dom";
import Main from "./Main";
import { configureStore } from "@store/configure-store";
import { Provider } from "react-redux";
import { JSDOM } from "jsdom";

const { store, history } = configureStore();

jest.mock("perfect-scrollbar");
window.scrollTo = jest.fn();

// https://discuss.codemirror.net/t/working-in-jsdom-or-node-js-natively/138/5
const doc = new JSDOM("<!doctype html><html><body></body></html>");
global.document = doc;
global.window = doc.defaultView;

it("renders without crashing", () => {
    const div = global.document.createElement("div");
    ReactDOM.render(
        <Provider store={store}>
            <Main history={history} />
        </Provider>,
        div
    );
    ReactDOM.unmountComponentAtNode(div);
});
