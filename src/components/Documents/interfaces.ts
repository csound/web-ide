import { ICsoundFile } from "../../db/interfaces";
import { ICsoundObj } from "../Csound/interfaces";

export interface IDocument extends ICsoundFile {
    csoundInstance: ICsoundObj;
    currentValue: string;
    savedValue: string;
}

export interface IScratchPad {
    csoundInstance: ICsoundObj;
    currentValue: string;
    type?: string;
}
