import { IDocumentFileType } from "./types";

export function filenameToType(filename: string): IDocumentFileType {
    if (filename.endsWith(".csd")) {
        return "csd";
    } else if (filename.endsWith(".sco")) {
        return "sco";
    } else if (filename.endsWith(".orc")) {
        return "orc";
    } else if (filename.endsWith(".udo")) {
        return "udo";
    } else {
        return "txt";
    }
}
