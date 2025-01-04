import {
    doc,
    DocumentChange,
    getDoc,
    QueryDocumentSnapshot,
    Timestamp
} from "firebase/firestore";
import { getDownloadURL } from "firebase/storage";
import { Mime } from "mime";
import { storageReference, projectLastModified } from "@config/firestore";
import { IFirestoreDocument, IFirestoreProject } from "@db/types";
import { IDocument, IDocumentFileType, IProject } from "./types";
import { CsoundObj } from "@csound/browser";
import { dropLast, isNil, prop, propOr, reject } from "ramda";

const mime = new Mime();

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
    const mimeType = mime.getType(fileName) || "";
    const endings = [".wav", ".ogg", ".mp3", "aiff", "flac"];
    const lower = fileName.toLowerCase();
    return (
        endings.some((ending) => lower.endsWith(ending)) ||
        mimeType.startsWith("audio")
    );
}

export function isPlotDataFile(fileName: string): boolean {
    return fileName.endsWith(".plot.csv") || fileName.endsWith(".plot.tsv");
}

export const generateEmptyDocument = (
    documentUid: string,
    filename: string
): IDocument => ({
    filename,
    currentValue: "",
    created: Date.now(),
    documentUid,
    lastModified: Date.now(),
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
        csound.fs.mkdir(document.filename);
        return;
    }

    const steps = absolutePath.split("/").filter((p) => p.length > 0);

    if (steps.length > 1) {
        csound.fs.mkdir(dropLast(1, steps).join("/"));
    }

    if (document.type === "bin") {
        const path = `${document.userUid}/${projectUid}/${document.documentUid}`;
        try {
            const downloadUrl = await getDownloadURL(
                await storageReference(path)
            );
            const response = await fetch(downloadUrl);
            const arrayBuffer = await response.arrayBuffer();
            const blob = new Uint8Array(arrayBuffer);
            await csound.fs.writeFile(absolutePath, blob);
        } catch (error) {
            console.error(error);
        }
    } else {
        const encoder = new TextEncoder();
        csound &&
            typeof csound.fs.writeFile === "function" &&
            (await csound.fs.writeFile(
                absolutePath,
                encoder.encode(document.currentValue)
            ));
    }
};

export const fileDocumentDataToDocumentType = (
    documentData: IFirestoreDocument,
    documentUid: string
): IDocument =>
    ({
        created: documentData?.created?.toMillis() ?? undefined,
        currentValue: documentData["value"],
        description: documentData["description"],
        documentUid,
        filename: documentData["name"],
        isModifiedLocally: false,
        lastModified: documentData?.lastModified?.toMillis() ?? undefined,
        savedValue: documentData["value"],
        type: documentData["type"],
        userUid: documentData["userUid"],
        path: reject(isNil, documentData["path"] || [])
    }) as IDocument;

export const convertDocumentSnapToDocumentsMap = (
    documentsToAdd: DocumentChange[]
): Record<string, IDocument> => {
    return documentsToAdd
        .map((doc) => [doc.doc, doc.doc.data()])
        .reduce(
            (
                accumulator: Record<string, IDocument>,
                [doc, documentData]: any[]
            ) => {
                const documentUid = doc.id;
                accumulator[doc.id] = fileDocumentDataToDocumentType(
                    documentData,
                    documentUid
                );
                // console.log(
                //     "Document data",
                //     documentUid,
                //     doc,
                //     documentData,
                //     accumulator[doc.id]
                // );

                return accumulator;
            },
            {}
        );
};

export const firestoreProjectToIProject = (
    project: IFirestoreProject
): IProject => ({
    projectUid: project.id || "",
    description: propOr("", "description", project),
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
    projSnap: QueryDocumentSnapshot
): Promise<IProject> => {
    const projData = projSnap.data();
    const lastModified = await getDoc(doc(projectLastModified, projSnap.id));
    const lastModifiedData = lastModified.exists() && lastModified.data();
    const project = firestoreProjectToIProject(projData as IFirestoreProject);
    project["projectUid"] = projSnap.id;

    if (lastModifiedData && lastModifiedData.target) {
        project["cachedProjectLastModified"] =
            lastModifiedData.target.toMillis();
    }
    if (projData.created) {
        project.created = Timestamp.fromMillis(
            (projData.created as Timestamp).toMillis()
        );
    }
    return project;
};
