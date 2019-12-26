import { configureStore } from "./configure-store";

// the seperation from configureStore decleration
// and the caller, prevents init errors
// https://github.com/reduxjs/redux-toolkit/issues/167
export const { store, history } = configureStore();
