import { getAuth } from "firebase/auth";
import {
    collection,
    doc,
    getDocFromServer,
    getDocsFromServer,
    query,
    where
} from "firebase/firestore";
import { projects } from "@config/firestore";
import type { IDocument } from "./types";

export {
    destinationError,
    nameError,
    sameFolder
} from "../../../functions/src/save_as_validation";
export type {
    SaveAsProject,
    SaveAsEntry,
    SaveAsRequest
} from "../../../functions/src/save_as_validation";
import {
    requestError,
    type SaveAsProject,
    type SaveAsEntry,
    type SaveAsRequest,
    type SaveAsResult
} from "../../../functions/src/save_as_validation";
import { getFunctions, httpsCallable } from "firebase/functions";

function requireUser(uid: string) {
    if (!uid || getAuth().currentUser?.uid !== uid)
        throw new Error("Sign in again to save a copy.");
}

export async function listSaveAsProjects(
    uid: string
): Promise<SaveAsProject[]> {
    requireUser(uid);
    // The IDE's write-access model is ownership, not public visibility.
    const snapshot = await getDocsFromServer(
        query(projects, where("userUid", "==", uid))
    );
    requireUser(uid);
    return snapshot.docs
        .map((project) => ({
            id: project.id,
            name: project.data().name,
            isPublic: project.data().public === true
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadSaveAsDestination(uid: string, projectUid: string) {
    requireUser(uid);
    const reference = doc(projects, projectUid);
    const project = await getDocFromServer(reference);
    if (!project.exists() || project.data().userUid !== uid)
        throw new Error("You no longer have write access to this project.");
    const files = await getDocsFromServer(collection(reference, "files"));
    requireUser(uid);
    return {
        project: {
            id: projectUid,
            name: project.data().name as string,
            isPublic: project.data().public === true
        },
        entries: files.docs.map((file): SaveAsEntry => ({
            id: file.id,
            name: file.data().name,
            type: file.data().type,
            path: file.data().path || []
        }))
    };
}

/** The server checks names and writes the copy in one transaction. */
export async function saveTextAs(uid: string, request: SaveAsRequest) {
    requireUser(uid);
    const error = requestError(request);
    if (error) throw new Error(error);
    const { data } = await httpsCallable<SaveAsRequest, SaveAsResult>(
        getFunctions(),
        "save_as_file"
    )(request);
    const documents = data.entries.map((entry): IDocument => ({
        documentUid: entry.id,
        filename: entry.name,
        type: entry.type === "folder" ? "folder" : "txt",
        path: entry.path,
        userUid: uid,
        currentValue: entry.id === data.documentUid ? request.value : "",
        savedValue: entry.id === data.documentUid ? request.value : "",
        isModifiedLocally: false,
        created: undefined,
        lastModified: undefined
    }));
    return { project: data.project, documentUid: data.documentUid, documents };
}
