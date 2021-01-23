import {
    storageReference,
    getFirebaseTimestamp,
    projectLastModified
} from "@config/firestore";
import { IDocument, IDocumentsMap, IDocumentFileType, IProject } from "./types";
import { ICsoundObject } from "@comp/csound/types";
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

export function textOrBinary(filename: string): IDocumentFileType {
    const textFiles = [".csd", ".sco", ".orc", ".udo", ".txt", ".md", ".inc"];
    const lowerName = filename.toLowerCase();

    if (textFiles.some((extension) => lowerName.endsWith(extension))) {
        return "txt";
    }
    return "bin";
}

export function isAudioFile(fileName: string) {
    // currently does not deal with FLAC, not sure if browser supports it
    const endings = [".wav", ".ogg", ".mp3"];
    const lower = fileName.toLowerCase();
    return endings.some((ending) => lower.endsWith(ending));
}

export const generateEmptyDocument = (documentUid, filename): IDocument => ({
    filename,
    currentValue: "",
    created: getFirebaseTimestamp(),
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
        csound: ICsoundObject,
        document: IDocument,
        absolutePath: string
    ) => {
        if (document.type === "folder") {
            return;
        }
        if (document.type === "bin") {
            const path = `${document.userUid}/${projectUid}/${document.documentUid}`;
            return storageReference
                .child(path)
                .getDownloadURL()
                .then(function (url) {
                    // This can be downloaded directly:
                    const xhr = new XMLHttpRequest();
                    xhr.responseType = "arraybuffer";
                    xhr.addEventListener("load", function (event) {
                        const blob = xhr.response;
                        csound &&
                            typeof csound.writeToFS === "function" &&
                            csound.writeToFS(absolutePath, blob);
                    });
                    xhr.open("GET", url);
                    xhr.send();
                })
                .catch(function (error) {
                    // Handle any errors
                });
        } else {
            const encoder = new TextEncoder();
            csound &&
                typeof csound.writeToFS === "function" &&
                csound.writeToFS(
                    absolutePath,
                    encoder.encode(document.savedValue)
                );
        }
    }
);

export const fileDocumentDataToDocumentType = (documentData) =>
    ({
        created: documentData["created"],
        currentValue: documentData["value"],
        description: documentData["description"],
        documentUid: documentData["documentUid"],
        filename: documentData["name"],
        isModifiedLocally: false,
        lastModified: documentData["lastModified"],
        savedValue: documentData["value"],
        type: documentData["type"],
        userUid: documentData["userUid"],
        path: reject(isNil, documentData["path"] || [])
    } as IDocument);

export const convertDocumentSnapToDocumentsMap = (documentsToAdd) =>
    (pipe as any)(
        map(prop("doc")),
        map((d: any) => assoc("documentUid", d.id, d.data())),
        reduce((accumulator: IDocumentsMap, documentData: any) => {
            accumulator[
                documentData["documentUid"]
            ] = fileDocumentDataToDocumentType(documentData);
            return accumulator;
        }, {})
    )(documentsToAdd);

export const convertProjectSnapToProject = async (projSnap) => {
    const projData = projSnap.data();
    const lastModified = await projectLastModified.doc(projSnap.id).get();
    const lastModifiedData = lastModified.exists && lastModified.data();
    return {
        projectUid: projSnap.id,
        description: propOr("", "description", projData),
        created: prop("created", projData),
        documents: {},
        isPublic: propOr(false, "public", projData),
        name: propOr("", "name", projData),
        userUid: propOr("", "userUid", projData),
        iconBackgroundColor: prop("iconBackgroundColor", projData),
        iconForegroundColor: prop("iconForegroundColor", projData),
        iconName: prop("iconName", projData),
        tags: [],
        stars: {},
        cachedProjectLastModified: lastModifiedData && lastModifiedData.target
    } as IProject;
};
