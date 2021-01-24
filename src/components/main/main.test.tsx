import "jest";
import React from "react";
import Main from "./main";
import { TestRenderer } from "react-redux-test-renderer";
import { configureStore } from "@store/configure-store";
import { Provider } from "react-redux";
const { store } = configureStore();

jest.mock("perfect-scrollbar");
jest.mock("dom-to-image-more");

const WrappedMain = () => (
    <Provider store={store}>
        <Main />
    </Provider>
);

const MainRenderer = new TestRenderer(WrappedMain, {}, {});

it("renders without crashing", () => {
    expect(() => {
        MainRenderer.renderWithStore(store.getState());
    }).not.toThrow();
});
