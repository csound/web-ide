import { IDocumentFileType } from "./types";

export function textOrBinary(filename: string): IDocumentFileType {
    const textFiles = [".csd", ".sco", ".orc", ".udo", ".txt", ".md", ".inc"];
    const lowerName = filename.toLowerCase();

    if (textFiles.find(ext => lowerName.endsWith(ext))) {
        return "txt";
    }

    return "bin";
}

export function isAudioFile(fileName: string) {
    // currently does not deal with FLAC, not sure if browser supports it
    const endings = [".wav", ".ogg", ".mp3"];
    const lower = fileName.toLowerCase();
    return endings.some(ending => lower.endsWith(ending));
}
