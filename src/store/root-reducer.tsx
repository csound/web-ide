import { Reducer } from "redux";
import BottomTabsReducer from "@comp/bottom-tabs/reducer";
import ConsoleReducer from "@comp/console/reducer";
import CsoundReducer from "@comp/csound/reducer";
import FileTreeReducer from "@comp/file-tree/reducer";
import HomeReducer from "@comp/home/reducer";
import HotKeysReducer from "@comp/hot-keys/reducer";
import IDReducer from "../db/id-reducer";
import LoginReducer from "@comp/login/reducer";
import ModalReducer from "@comp/modal/reducer";
import ProfileReducer from "@comp/profile/reducer";
import ProjectEditorReducer from "@comp/project-editor/reducer";
import ProjectLastModifiedReducer from "@comp/project-last-modified/reducer";
import ProjectsReducer from "@comp/projects/reducer";
import SnackbarReducer from "@comp/snackbar/reducer";
import TargetControlsReducer from "@comp/target-controls/reducer";
import ThemeReducer from "@comp/themes/reducer";

// const RootReducer = ({ routerReducer }: { routerReducer: any }): Reducer =>
//     combineReducers({
//         router: routerReducer,
//         ProjectsReducer,
//         LoginReducer,
//         ProjectEditorReducer,
//         userProfile: IDReducer,
//         csound: CsoundReducer,
//         FileTreeReducer,
//         ThemeReducer,
//         ModalReducer,
//         ConsoleReducer,
//         ProfileReducer,
//         SnackbarReducer,
//         HotKeysReducer,
//         TargetControlsReducer,
//         ProjectLastModifiedReducer,
//         BottomTabsReducer,
//         HomeReducer
//     });

// export default RootReducer;

export const reducer = {
    ProjectsReducer,
    LoginReducer,
    ProjectEditorReducer,
    userProfile: IDReducer,
    csound: CsoundReducer,
    FileTreeReducer,
    ThemeReducer,
    ModalReducer,
    ConsoleReducer,
    ProfileReducer,
    SnackbarReducer,
    HotKeysReducer,
    TargetControlsReducer,
    ProjectLastModifiedReducer,
    BottomTabsReducer,
    HomeReducer
};
