// import { IProjectsReducer } from "@comp/projects/types";
// import { IProjectEditorReducer } from "@comp/project-editor/reducer";
// import { ICsoundReducer } from "@comp/csound/reducer";
// import { IModalReducer } from "@comp/modal/reducer";
// import { IConsoleReducer } from "@comp/console/reducer";
// import { IThemeReducer } from "@comp/themes/reducer";
// import { IUserProfile } from "@root/db/types";
// import { ITargetControlsReducer } from "@comp/target-controls/reducer";
// import { IProjectLastModifiedReducer } from "@comp/project-last-modified/reducer";
// import { IProfileReducer } from "@comp/profile/reducer";
// import { IBottomTabsReducer } from "@comp/bottom-tabs/types";
// import { ISnackbarReducer } from "@comp/snackbar/reducer";
// import { IHomeReducer } from "@comp/home/reducer";

// export interface IStore {
//     router: any;
//     ProjectsReducer: IProjectsReducer;
//     csound: ICsoundReducer;
//     LoginReducer: any;
//     ProjectEditorReducer: IProjectEditorReducer;
//     userProfile?: IUserProfile;
//     ThemeReducer: IThemeReducer;
//     ModalReducer: IModalReducer;
//     ConsoleReducer: IConsoleReducer;
//     TargetControlsReducer: ITargetControlsReducer;
//     ProjectLastModifiedReducer: IProjectLastModifiedReducer;
//     ProfileReducer: IProfileReducer;
//     BottomTabsReducer: IBottomTabsReducer;
//     SnackbarReducer: ISnackbarReducer;
//     HomeReducer: IHomeReducer;
// }

// export type Selector = (x: IStore) => any;

export type { RootState } from "./store";
