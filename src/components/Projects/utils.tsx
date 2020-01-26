import { storageRef, getFirebaseTimestamp } from "@config/firestore";
import { IDocument, IDocumentFileType } from "./types";
import { ICsoundObj } from "@comp/Csound/types";
import { curry } from "ramda";

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

export const generateEmptyDocument = (documentUid, filename): IDocument => ({
    filename,
    currentValue: "",
    createdAt: getFirebaseTimestamp(),
    documentUid,
    lastModified: getFirebaseTimestamp(),
    savedValue: "",
    type: "txt",
    userUid: "",
    isModifiedLocally: false
});

export const addDocumentToEMFS = curry(
    (projectUid: string, csound: ICsoundObj, document: IDocument) => {
        if (document.type === "bin") {
            let path = `${document.userUid}/${projectUid}/${document.documentUid}`;
            return storageRef
                .child(path)
                .getDownloadURL()
                .then(function(url) {
                    // This can be downloaded directly:
                    var xhr = new XMLHttpRequest();
                    xhr.responseType = "arraybuffer";
                    xhr.onload = function(event) {
                        let blob = xhr.response;
                        csound.writeToFS(document.filename, blob);
                    };
                    xhr.open("GET", url);
                    xhr.send();
                })
                .catch(function(error) {
                    // Handle any errors
                });
        } else {
            const encoder = new TextEncoder();
            csound.writeToFS(
                document.filename,
                encoder.encode(document.savedValue)
            );
        }
    }
);

export const fileDocDataToDocumentType = docData =>
    ({
        createdAt: docData["createdAt"] || docData["lastModified"], // migration fix
        currentValue: docData["value"],
        documentUid: docData["documentUid"],
        filename: docData["name"],
        isModifiedLocally: false,
        lastModified: docData["lastModified"],
        savedValue: docData["value"],
        type: docData["type"],
        userUid: docData["userUid"]
    } as IDocument);
