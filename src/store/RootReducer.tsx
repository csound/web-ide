import { combineReducers, AnyAction, Reducer } from "redux";
import { connectRouter, RouterState } from "connected-react-router";
import ProjectsReducer from "@comp/Projects/reducer";
import LoginReducer from "@comp/Login/reducer";
import TemplateReducer from "@comp/Themes/reducer";
import SnackbarReducer from "@comp/Snackbar/reducer";
import IDReducer from "../db/IDReducer";
import ProjectEditorReducer from "@comp/ProjectEditor/reducer";
import CsoundReducer from "@comp/Csound/reducer";
import ModalReducer from "@comp/Modal/reducer";
import ProfileReducer from "@comp/Profile/reducer";
import ConsoleReducer from "@comp/Console/reducer";
import HotKeysReducer from "@comp/HotKeys/reducer";
import TargetControlsReducer from "@comp/TargetControls/reducer";
import { History } from "history";

export default (history: History) =>
    combineReducers({
        ProjectsReducer,
        router: connectRouter(history) as Reducer<RouterState, AnyAction>,
        LoginReducer,
        ProjectEditorReducer,
        userProfile: IDReducer,
        theme: TemplateReducer,
        csound: CsoundReducer,
        ModalReducer,
        ProfileReducer,
        ConsoleReducer,
        SnackbarReducer,
        HotKeysReducer,
        TargetControlsReducer
    });
