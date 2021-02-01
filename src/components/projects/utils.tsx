import firebase from "firebase/app";
import {
    storageReference,
    getFirebaseTimestamp,
    projectLastModified
} from "@config/firestore";
import { IFirestoreDocument, IFirestoreProject } from "@db/types";
import { IDocument, IDocumentsMap, IDocumentFileType, IProject } from "./types";
import { CsoundObj } from "@csound/browser";
import {
    assoc,
    dropLast,
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
    const endings = [".wav", ".ogg", ".mp3", "aiff", "flac"];
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

export const addDocumentToEMFS = async (
    projectUid: string,
    csound: CsoundObj,
    document: IDocument,
    absolutePath: string
): Promise<void> => {
    if (!document.filename) {
        return;
    }

    if (document.type === "folder") {
        csound.fs.mkdirpSync(document.filename);
        return;
    }

    const steps = document.filename.split("/");
    if (steps.length > 1) {
        csound.fs.mkdirpSync(dropLast(steps).join("/"));
    }

    if (document.type === "bin") {
        const path = `${document.userUid}/${projectUid}/${document.documentUid}`;
        try {
            const downloadUrl = await storageReference
                .child(path)
                .getDownloadURL();
            const response = await fetch(downloadUrl);
            const arrayBuffer = await response.arrayBuffer();
            const blob = new Uint8Array(arrayBuffer);
            csound.fs.writeFileSync(absolutePath, blob);
        } catch (error) {
            console.error(error);
        }
    } else {
        const encoder = new TextEncoder();
        csound &&
            typeof csound.fs.writeFileSync === "function" &&
            csound.fs.writeFileSync(
                absolutePath,
                encoder.encode(document.currentValue)
            );
    }
};

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

export const firestoreProjectToIProject = (
    project: IFirestoreProject
): IProject => ({
    projectUid: project.id || "",
    description: propOr("", "description", project),
    // created: prop("created", project),
    documents: {},
    isPublic: propOr(false, "public", project),
    name: propOr("", "name", project),
    userUid: propOr("", "userUid", project),
    iconBackgroundColor: prop("iconBackgroundColor", project),
    iconForegroundColor: prop("iconForegroundColor", project),
    iconName: prop("iconName", project),
    tags: [],
    stars: {}
});

export const convertProjectSnapToProject = async (
    projSnap: firebase.firestore.QueryDocumentSnapshot
): Promise<IProject> => {
    const projData = projSnap.data();
    const lastModified = await projectLastModified.doc(projSnap.id).get();
    const lastModifiedData = lastModified.exists && lastModified.data();
    const project = firestoreProjectToIProject(projData as IFirestoreProject);
    if (lastModifiedData && lastModifiedData.target) {
        project["cachedProjectLastModified"] = lastModifiedData.target;
    }
    return project;
};
