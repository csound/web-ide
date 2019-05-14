import { combineReducers } from "redux";
import { connectRouter } from "connected-react-router";
import LoginReducer from "./components/Login/reducer";
import TemplateReducer from "./components/Themes/reducer";
import ProfileReducer from "./db/profileReducer";
import BurgerMenuReducer from "./components/BurgerMenu/reducer";
import { History } from "history";

export default (history: History) => combineReducers({
    router: connectRouter(history),
    LoginReducer,
    userProfile: ProfileReducer,
    theme: TemplateReducer,
    burgerMenu: BurgerMenuReducer,
});
