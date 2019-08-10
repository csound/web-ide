import { IAssetFile, ICsoundFile } from "../../db/interfaces";
import { ICsoundObj } from "../Csound/interfaces";

export interface IDocument extends ICsoundFile {
    currentValue: string;
    savedValue: string;
}

export interface IProject {
    projectId: number;
    assets: IAssetFile[];
    name: string;
    isPublic: boolean;
    documents: IDocument[];
}
