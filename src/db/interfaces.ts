import { IProjectsReducer } from "../components/Projects/reducer";
import { ILayoutReducer } from "../components/Layout/reducer";
import { ICsoundReducer } from "../components/Csound/reducer";

export interface IAssetFile {
    name: string;
    isBinary: boolean;
    lastEdit: Date;
    type: "binary" | "txt";
}

export interface ICsoundFile {
    name: string;
    lastEdit: Date;
    type: "csd" | "orc" | "sco" | "udo";
}

// export interface ICollection {
//     collectionId: number;
//     created: Date;
//     name: string;
//     lastEdit: Date;
//     projects: IProject[];
// }

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

export interface IBurgerMenu {
    isOpen: boolean;
}

export interface IStore {
    ProjectsReducer: any;
    csound: ICsoundReducer;
    router: any;
    LoginReducer: any;
    RouterReducer: any;
    LayoutReducer: ILayoutReducer;
    userProfile: IUserProfile | null;
    theme: ITheme;
}
