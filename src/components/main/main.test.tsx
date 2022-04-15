import "jest";
import React from "react";
import Main from "./main";
import { TestRenderer } from "react-redux-test-renderer";
import { configureStore } from "@store/configure-store";
import { Provider } from "react-redux";
const { store } = configureStore();

jest.mock("perfect-scrollbar");
jest.mock("dom-to-image-more");

jest.mock("firebase/app", () => {
    const getMock = jest.fn().mockReturnValue({
        docs: []
    });
    const whereMock_ = jest
        .fn()
        .mockReturnValue({ where: jest.fn(), get: getMock });
    // (whereMock_ as any).get = jest
    //     .fn()
    //     .mockReturnValue({
    //         then: jest.fn(),
    //         where: whereMock_,
    //         get: jest.fn()
    //     });
    const whereMock__ = jest
        .fn()
        .mockReturnValue({ where: whereMock_, get: getMock });
    // (whereMock__ as any).get = jest
    //     .fn()
    //     .mockReturnValue({
    //         then: jest.fn(),
    //         where: whereMock__,
    //         get: jest.fn()
    //     });

    const whereMock = jest
        .fn()
        .mockReturnValue({ where: whereMock__, get: jest.fn() });

    const firestoreMock = jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({ where: whereMock })
    });
    (firestoreMock as any).FieldValue = { serverTimestamp: {} as any };
    (firestoreMock as any).FieldPath = { documentId: jest.fn() };

    const authMock = jest
        .fn()
        .mockReturnValue({
            currentUser: false,
            onAuthStateChanged: jest.fn().mockReturnValue(jest.fn())
        });
    (authMock as any).GoogleAuthProvider = { PROVIDER_ID: "" as any };
    (authMock as any).FacebookAuthProvider = { PROVIDER_ID: "" as any };

    return {
        firestore: firestoreMock,
        storage: jest.fn().mockReturnValueOnce({ ref: jest.fn() }),
        apps: 0,
        auth: authMock
    };
});
jest.mock("@firebase/app");

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
