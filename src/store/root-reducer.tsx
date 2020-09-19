import { combineReducers, AnyAction, Reducer } from "redux";
import { connectRouter, RouterState } from "connected-react-router";
import ProjectsReducer from "@comp/projects/reducer";
import LoginReducer from "@comp/login/reducer";
import ThemeReducer from "@comp/themes/reducer";
import SnackbarReducer from "@comp/snackbar/reducer";
import IDReducer from "../db/id-reducer";
import ProjectEditorReducer from "@comp/project-editor/reducer";
import CsoundReducer from "@comp/csound/reducer";
import ModalReducer from "@comp/modal/reducer";
import ProfileReducer from "@comp/profile/reducer";
import ConsoleReducer from "@comp/console/reducer";
import HotKeysReducer from "@comp/hot-keys/reducer";
import HomeReducer from "@comp/home/reducer";
import TargetControlsReducer from "@comp/target-controls/reducer";
import ProjectLastModifiedReducer from "@comp/project-last-modified/reducer";
import { History } from "history";

export default (history: History) =>
    combineReducers({
        ProjectsReducer,
        router: connectRouter(history) as Reducer<RouterState, AnyAction>,
        LoginReducer,
        ProjectEditorReducer,
        userProfile: IDReducer,
        csound: CsoundReducer,
        ThemeReducer,
        ModalReducer,
        ConsoleReducer,
        ProfileReducer,
        SnackbarReducer,
        HotKeysReducer,
        TargetControlsReducer,
        ProjectLastModifiedReducer,
        HomeReducer
    });
