import { IDocumentFileType, IDocumentFileInternalType } from "./types";

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

export function textOrBinary(filename: string): IDocumentFileInternalType {
    const textFiles = [".csd", ".sco", ".orc", ".udo", ".txt", ".md", ".inc"];
    const lowerName = filename.toLowerCase();

    if(textFiles.find(ext => lowerName.endsWith(ext))) {
        return "txt";
    }

    return "bin";
}