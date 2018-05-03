import { combineReducers } from "redux";
import FirebaseReducer from "./FirebaseReducer";
import { routerReducer } from "react-router-redux";
const FIREBASE = "FIREBASE";

export default combineReducers({
    [FIREBASE]: FirebaseReducer,
    routing: routerReducer
});
