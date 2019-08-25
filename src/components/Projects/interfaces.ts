import { IAssetFile, ICsoundFile } from "../../db/interfaces";
// import { ICsoundObj } from "../Csound/interfaces";


export interface IDocument extends ICsoundFile {
    currentValue: string;
    documentUid: string;
    savedValue: string;
}

export interface IProject {
    projectUid: string;
    assets: IAssetFile[];
    name: string;
    isPublic: boolean;
    documents: {[documentUid: string]: IDocument};
}
