import firebase from "firebase/app";
import {
    storageReference,
    getFirebaseTimestamp,
    projectLastModified
} from "@config/firestore";
import { IFirestoreDocument } from "@db/types";
import { IDocument, IDocumentsMap, IDocumentFileType, IProject } from "./types";
import { CsoundObj } from "@csound/browser";
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

export function isAudioFile(fileName: string): boolean {
    // currently does not deal with FLAC, not sure if browser supports it
    const endings = [".wav", ".ogg", ".mp3"];
    const lower = fileName.toLowerCase();
    return endings.some((ending) => lower.endsWith(ending));
}

export const generateEmptyDocument = (
    documentUid: string,
    filename: string
): IDocument => ({
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
        csound: CsoundObj,
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
                            typeof csound.fs.writeFileSync === "function" &&
                            csound.fs.writeFileSync(
                                absolutePath,
                                new Uint8Array(blob)
                            );
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
                typeof csound.fs.writeFileSync === "function" &&
                csound.fs.writeFileSync(
                    absolutePath,
                    encoder.encode(document.savedValue)
                );
        }
    }
);

export const fileDocumentDataToDocumentType = (
    documentData: IFirestoreDocument
): IDocument =>
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

export const convertDocumentSnapToDocumentsMap = (
    documentsToAdd: IFirestoreDocument[]
): Record<string, IDocument> =>
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

export const convertProjectSnapToProject = async (
    projSnap: firebase.firestore.QueryDocumentSnapshot
): Promise<IProject> => {
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
