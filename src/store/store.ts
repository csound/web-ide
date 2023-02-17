/* eslint-disable unicorn/prefer-spread */
import {
    AnyAction,
    ThunkAction,
    ThunkDispatch,
    configureStore
} from "@reduxjs/toolkit";
import { useDispatch as useDispatchOriginal } from "react-redux";
import RootReducer from "./root-reducer";
import { createReduxHistoryContext } from "redux-first-history";
import { createBrowserHistory } from "history";
import "symbol-observable";

// the manual as a dock is an iframe
// just to make the dev little faster
// we don't include the devtools
const insideIframe = !!window.frameElement;

const { createReduxHistory, routerMiddleware, routerReducer } =
    createReduxHistoryContext({
        history: createBrowserHistory()
    });

const rootReducer = RootReducer({ routerReducer });

export const store = configureStore({
    reducer: rootReducer,
    devTools: !insideIframe,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(routerMiddleware)
});

export const history = createReduxHistory(store);

export type AppDispatch = typeof store.dispatch;
export { useSelector } from "react-redux";
export { createAsyncThunk } from "@reduxjs/toolkit";

export type RootState = ReturnType<typeof rootReducer>;

export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    AnyAction
>;

export type AppThunkDispatch = ThunkDispatch<RootState, any, AnyAction>;

export const useDispatch: () => AppDispatch = useDispatchOriginal;
