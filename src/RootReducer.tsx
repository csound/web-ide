import { combineReducers } from "redux";
import { connectRouter } from "connected-react-router";
import ProjectsReducer from "./components/Projects/reducer";
import LoginReducer from "./components/Login/reducer";
import TemplateReducer from "./components/Themes/reducer";
import ProfileReducer from "./db/profileReducer";
import BurgerMenuReducer from "./components/BurgerMenu/reducer";
import GoldenLayoutReducer from "./components/GoldenLayouts/reducer";
import CsoundReducer from "./components/Csound/reducer";
import { History } from "history";

export default (history: History) => combineReducers({
    ProjectsReducer,
    router: connectRouter(history),
    LoginReducer,
    GoldenLayoutReducer,
    userProfile: ProfileReducer,
    theme: TemplateReducer,
    burgerMenu: BurgerMenuReducer,
    csound: CsoundReducer,
});
