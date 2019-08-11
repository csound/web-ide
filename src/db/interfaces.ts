import { IGoldenLayoutReducer } from "../components/GoldenLayouts/reducer";
import { IProjectsReducer } from "../components/Projects/reducer";

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
    router: any;
    LoginReducer: any;
    RouterReducer: any;
    GoldenLayoutReducer: IGoldenLayoutReducer;
    userProfile: IUserProfile | null;
    theme: ITheme;
    burgerMenu: IBurgerMenu;
}
