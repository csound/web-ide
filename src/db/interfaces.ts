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
    collections: ICollection[];
    userid: number;
}

export interface ITemplate {
    fontFamily: string;
    fontSize: number;
    theme: string;
}

export interface IStore {
    router: any;
    LoginReducer: any;
    RouterReducer: any;
    userProfile: IUserProfile | null;
    template: ITemplate;
}
