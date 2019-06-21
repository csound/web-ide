import { IGoldenLayoutReducer } from "../components/GoldenLayouts/reducer";

export interface IAssetFile {
    name: string;
    isBinary: boolean;
    lastEdit: Date;
}

export interface ICsoundFile {
    name: string;
    lastEdit: Date;
}

export interface IProject {
    projectId: number;
    assets: IAssetFile[];
    name: string;
    isPublic: boolean;
    files: ICsoundFile[];
}

export interface ICollection {
    collectionId: number;
    created: Date;
    name: string;
    lastEdit: Date;
    projects: IProject[];
}

export interface IUserProfile {
    name: string;
    email: string;
    collections?: ICollection[];
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
    router: any;
    LoginReducer: any;
    RouterReducer: any;
    GoldenLayoutReducer: IGoldenLayoutReducer;
    userProfile: IUserProfile | null;
    theme: ITheme;
    burgerMenu: IBurgerMenu;
}
