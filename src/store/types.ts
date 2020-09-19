import { IProjectsReducer } from "@comp/projects/types";
import { IProjectEditorReducer } from "@comp/project-editor/reducer";
import { ICsoundReducer } from "@comp/csound/reducer";
import { IModalReducer } from "@comp/modal/reducer";
import { IConsoleReducer } from "@comp/console/reducer";
import { IThemeReducer } from "@comp/themes/reducer";
import { IUserProfile } from "@root/db/types";
import { ITargetControlsReducer } from "@comp/target-controls/reducer";
import { IProjectLastModifiedReducer } from "@comp/project-last-modified/reducer";
import { IProfileReducer } from "@comp/profile/reducer";

export interface IStore {
    ProjectsReducer: IProjectsReducer;
    csound: ICsoundReducer;
    router: any;
    LoginReducer: any;
    ProjectEditorReducer: IProjectEditorReducer;
    userProfile?: IUserProfile;
    ThemeReducer: IThemeReducer;
    ModalReducer: IModalReducer;
    ConsoleReducer: IConsoleReducer;
    TargetControlsReducer: ITargetControlsReducer;
    ProjectLastModifiedReducer: IProjectLastModifiedReducer;
    ProfileReducer: IProfileReducer;
}

export type Selector = (x: IStore) => any;
