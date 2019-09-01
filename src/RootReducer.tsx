import { combineReducers, AnyAction, Reducer } from "redux";
import { connectRouter, RouterState } from "connected-react-router";
import ProjectsReducer from "./components/Projects/reducer";
import LoginReducer from "./components/Login/reducer";
import TemplateReducer from "./components/Themes/reducer";
import IDReducer from "./db/IDReducer";
import ProjectEditorReducer from "./components/ProjectEditor/reducer";
import CsoundReducer from "./components/Csound/reducer";
import ModalReducer from "./components/Modal/reducer";
import ProfileReducer from "./components/Profile/reducer";
import { History } from "history";

export default (history: History) =>
    combineReducers({
        projects: ProjectsReducer,
        router: connectRouter(history) as Reducer<RouterState, AnyAction>,
        LoginReducer,
        ProjectEditorReducer,
        userProfile: IDReducer,
        theme: TemplateReducer,
        csound: CsoundReducer,
        ModalReducer,
        ProfileReducer
    });
