import { combineReducers, AnyAction, Reducer } from "redux";
import { connectRouter, RouterState } from "connected-react-router";
import ProjectsReducer from "./components/Projects/reducer";
import LoginReducer from "./components/Login/reducer";
import TemplateReducer from "./components/Themes/reducer";
import ProfileReducer from "./db/profileReducer";
import LayoutReducer from "./components/Layout/reducer";
import CsoundReducer from "./components/Csound/reducer";
import ModalReducer from "./components/Modal/reducer";
import { History } from "history";

export default (history: History) => combineReducers({
    ProjectsReducer,
    router: connectRouter(history) as Reducer<RouterState, AnyAction>,
    LoginReducer,
    LayoutReducer,
    userProfile: ProfileReducer,
    theme: TemplateReducer,
    csound: CsoundReducer,
    ModalReducer,
});
