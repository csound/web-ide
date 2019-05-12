import { combineReducers } from "redux";
import { connectRouter } from "connected-react-router";
import LoginReducer from "./containers/Login/reducer";
import TemplateReducer from "./Themes/reducer";
import ProfileReducer from "./db/profileReducer";
import BurgerMenuReducer from "./containers/BurgerMenu/reducer";
import { History } from "history";

export default (history: History) => combineReducers({
    router: connectRouter(history),
    LoginReducer,
    userProfile: ProfileReducer,
    theme: TemplateReducer,
    burgerMenu: BurgerMenuReducer,
});
