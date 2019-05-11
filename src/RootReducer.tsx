import { combineReducers } from "redux";
import { connectRouter } from 'connected-react-router'
import LoginReducer from "./containers/Login/reducer";
import RouterReducer from "./Router/reducer";
import { History } from "history";

export default (history: History) => combineReducers({
    router: connectRouter(history),
    LoginReducer,
    RouterReducer
});
