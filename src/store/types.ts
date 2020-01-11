import { IProjectsReducer } from "@comp/Projects/types";
import { IProjectEditorReducer } from "@comp/ProjectEditor/reducer";
import { ICsoundReducer } from "@comp/Csound/reducer";
import { IModalReducer } from "@comp/Modal/reducer";
import { IConsoleReducer } from "@comp/Console/reducer";
import { IThemeReducer } from "@comp/Themes/reducer";
import { IUserProfile } from "@root/db/types";

export interface IStore {
    ProjectsReducer: IProjectsReducer;
    csound: ICsoundReducer;
    router: any;
    LoginReducer: any;
    ProjectEditorReducer: IProjectEditorReducer;
    userProfile: IUserProfile | null;
    ThemeReducer: IThemeReducer;
    ModalReducer: IModalReducer;
    ConsoleReducer: IConsoleReducer;
}

export type ISelector = (x: IStore) => any;
