import { combineReducers } from "redux";
import { connectRouter } from "connected-react-router";
import LoginReducer from "./containers/Login/reducer";
import TemplateReducer from "./Templates/reducer";
import ProfileReducer from "./db/profileReducer";
import { History } from "history";

export default (history: History) => combineReducers({
    router: connectRouter(history),
    LoginReducer,
    userProfile: ProfileReducer,
    template: TemplateReducer,
});
