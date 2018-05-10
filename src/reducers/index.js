import { combineReducers } from "redux";
import FirebaseReducer from "./FirebaseReducer";
import AppReducer from "./AppReducer";
import { routerReducer } from "react-router-redux";
const FIREBASE = "FIREBASE";
const APP = "APP";

export default combineReducers({
    [FIREBASE]: FirebaseReducer,
    [APP]: AppReducer,
    routing: routerReducer
});
