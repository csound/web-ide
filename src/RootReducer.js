import { combineReducers } from "redux";
import LoginReducer from "./containers/Login/reducer";
import RouterReducer from "./Router/reducer";
export default combineReducers({
    LoginReducer,
    RouterReducer
});
