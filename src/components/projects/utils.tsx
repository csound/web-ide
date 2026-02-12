import {
    doc,
    DocumentChange,
    getDoc,
    QueryDocumentSnapshot,
    Timestamp
} from "firebase/firestore";
import { getDownloadURL } from "firebase/storage";
import mime from "mime";
import { storageReference, projectLastModified } from "@config/firestore";
import { IFirestoreDocument, IFirestoreProject } from "@db/types";
import { IDocument, IDocumentFileType, IProject } from "./types";
import { CsoundObj } from "@comp/csound/types";
import { dropLast, isNil, prop, propOr, reject } from "ramda";

const BINARY_FILE_CACHE_NAME = "csound-project-binary-files-v1";
const BINARY_FILE_CACHE_NAMESPACE = "/__csound_project_binary_cache__";

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

export const addDocumentToCsoundFS = async (
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
            const binary = await fetchBinaryDocument(
                downloadUrl,
                projectUid,
                document
            );
            await csound.fs.writeFile(absolutePath, binary);
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

const createBinaryCacheRequest = (
    projectUid: string,
    document: IDocument
): Request => {
    const cacheVersion = document.lastModified ?? "0";
    const cacheKey = [
        document.userUid,
        projectUid,
        document.documentUid,
        cacheVersion
    ].join("/");

    return new Request(
        `${BINARY_FILE_CACHE_NAMESPACE}/${encodeURIComponent(cacheKey)}`
    );
};

const fetchBinaryDocument = async (
    downloadUrl: string,
    projectUid: string,
    document: IDocument
): Promise<Uint8Array> => {
    const hasCacheStorage =
        typeof window !== "undefined" &&
        typeof window.caches !== "undefined" &&
        typeof document?.documentUid === "string";

    if (!hasCacheStorage) {
        const response = await fetch(downloadUrl);
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    }

    const cacheRequest = createBinaryCacheRequest(projectUid, document);
    let cache: Cache | undefined;
    try {
        cache = await caches.open(BINARY_FILE_CACHE_NAME);
        const cachedResponse = await cache.match(cacheRequest);

        if (cachedResponse) {
            const cachedBuffer = await cachedResponse.arrayBuffer();
            return new Uint8Array(cachedBuffer);
        }
    } catch (error) {
        console.warn("Binary cache read failed, falling back to network", error);
    }

    const networkResponse = await fetch(downloadUrl);
    if (!networkResponse.ok) {
        throw new Error(
            `Failed to download binary document: ${networkResponse.status}`
        );
    }

    if (cache) {
        try {
            await cache.put(cacheRequest, networkResponse.clone());
        } catch (error) {
            console.warn(
                "Binary cache write failed, continuing without cache",
                error
            );
        }
    }

    const networkBuffer = await networkResponse.arrayBuffer();

    return new Uint8Array(networkBuffer);
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
