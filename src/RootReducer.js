import { combineReducers } from "redux";
import { connectRouter } from 'connected-react-router'
import LoginReducer from "./containers/Login/reducer";
import RouterReducer from "./Router/reducer";

export default (history) => combineReducers({
    router: connectRouter(history),
    LoginReducer,
    RouterReducer
});
