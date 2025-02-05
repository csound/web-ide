import {
    Action,
    ThunkAction,
    ThunkDispatch,
    configureStore
} from "@reduxjs/toolkit";
// import { combineReducers } from "redux";
import {
    TypedUseSelectorHook,
    useDispatch as useDispatchOriginal,
    useSelector as useSelectorOriginal
} from "react-redux";
import { reducer } from "./root-reducer";
import { createReduxHistoryContext } from "redux-first-history";
import { createBrowserHistory } from "history";

// the manual as a dock is an iframe
// just to make the dev little faster
// we don't include the devtools
const insideIframe = !!window.frameElement;

// const { createReduxHistory, routerMiddleware, routerReducer } =
//     createReduxHistoryContext({
//         history: createBrowserHistory()
//     });

// const rootReducer = { ...reducer, router: routerReducer };

export const store = configureStore({
    reducer,
    devTools: !insideIframe,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware()
});

export type AppDispatch = typeof store.dispatch;
export { createAsyncThunk } from "@reduxjs/toolkit";

export type RootState = ReturnType<typeof store.getState>;

export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>;

export type AppThunkDispatch = ThunkDispatch<RootState, any, Action<string>>;

export const useDispatch: () => AppDispatch = useDispatchOriginal;
export const useSelector: TypedUseSelectorHook<RootState> = useSelectorOriginal;
