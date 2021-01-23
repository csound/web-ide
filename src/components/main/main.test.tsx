import "jest";
import React from "react";
import ReactDOM from "react-dom";
import Main from "./main";
import { configureStore } from "@store/configure-store";
import { Provider } from "react-redux";
import { JSDOM } from "jsdom";

const { store } = configureStore();

jest.mock("perfect-scrollbar");

const { window } = new JSDOM("<!doctype html><html><body></body></html>", {
    pretendToBeVisual: true,
    features: {
        FetchExternalResources: ["script", "css"],
        QuerySelector: true
    },
    resources: "usable"
});

global.document = window.document;
global.window = window;
global.scrollTo = jest.fn();

it("renders without crashing", () => {
    const div = global.document.createElement("div");
    ReactDOM.render(
        <Provider store={store}>
            <Main />
        </Provider>,
        div
    );
    ReactDOM.unmountComponentAtNode(div);
});
