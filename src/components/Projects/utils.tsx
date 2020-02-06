import { storageRef, getFirebaseTimestamp } from "@config/firestore";
import { IDocument, IDocumentsMap, IDocumentFileType, IProject } from "./types";
import { ICsoundObj } from "@comp/Csound/types";
import {
    assoc,
    curry,
    isNil,
    map,
    pipe,
    prop,
    propOr,
    reduce,
    reject
} from "ramda";
import { projectLastModified } from "@config/firestore";

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
    isModifiedLocally: false,
    path: []
});

export const addDocumentToEMFS = curry(
    (
        projectUid: string,
        csound: ICsoundObj,
        document: IDocument,
        absolutePath: string
    ) => {
        if (document.type === "folder") return;
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
                        csound.writeToFS(absolutePath, blob);
                    };
                    xhr.open("GET", url);
                    xhr.send();
                })
                .catch(function(error) {
                    // Handle any errors
                });
        } else {
            const encoder = new TextEncoder();
            csound.writeToFS(absolutePath, encoder.encode(document.savedValue));
        }
    }
);

export const fileDocDataToDocumentType = docData =>
    ({
        createdAt: docData["createdAt"] || docData["lastModified"], // migration fix
        currentValue: docData["value"],
        description: docData["description"],
        documentUid: docData["documentUid"],
        filename: docData["name"],
        isModifiedLocally: false,
        lastModified: docData["lastModified"],
        savedValue: docData["value"],
        type: docData["type"],
        userUid: docData["userUid"],
        path: reject(isNil, docData["path"] || [])
    } as IDocument);

export const convertDocSnapToDocumentsMap = docsToAdd =>
    (pipe as any)(
        map(prop("doc")),
        map((d: any) => assoc("documentUid", d.id, d.data())),
        reduce((acc: IDocumentsMap, docData: any) => {
            acc[docData["documentUid"]] = fileDocDataToDocumentType(docData);
            return acc;
        }, {})
    )(docsToAdd);

export const convertProjectSnapToProject = async projSnap => {
    const projData = projSnap.data();
    const lastModified = await projectLastModified.doc(projSnap.id).get();
    const lastModifiedData = lastModified.exists ? lastModified.data() : null;
    return {
        projectUid: projSnap.id,
        description: propOr("", "description", projData),
        documents: {},
        isPublic: propOr(false, "public", projData),
        name: propOr("", "name", projData),
        userUid: propOr("", "userUid", projData),
        tags: [],
        stars: [],
        cachedProjectLastModified: lastModifiedData
            ? lastModifiedData.target
            : null
    } as IProject;
};
