import { IProjectsReducer } from "../components/Projects/types";
import { IProjectEditorReducer } from "../components/ProjectEditor/reducer";
import { ICsoundReducer } from "../components/Csound/reducer";
import { IModalReducer } from "../components/Modal/reducer";
import { IConsoleReducer } from "../components/Console/reducer";
import IDReducer from "./IDReducer";

export interface IAssetFile {
    name: string;
    isBinary: boolean;
    lastEdit: Date | null;
    type: "binary" | "txt";
}

export interface ICsoundFile {
    name: string;
    lastEdit: Date | null;
    type: "csd" | "orc" | "sco" | "udo";
}

export interface IUserProfile {
    name: string;
    email: string;
    userid?: number;
    photoUrl?: string;
}

export interface ITheme {
    fontFamily: string;
    fontSize: number;
    name: string;
}

export interface IStore {
    ProjectsReducer: IProjectsReducer;
    csound: ICsoundReducer;
    router: any;
    LoginReducer: any;
    ProjectEditorReducer: IProjectEditorReducer;
    userProfile: IUserProfile | null;
    theme: ITheme;
    ModalReducer: IModalReducer;
    ConsoleReducer: IConsoleReducer;
}
