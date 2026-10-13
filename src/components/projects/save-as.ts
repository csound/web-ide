import { getAuth } from "firebase/auth";
import {
    collection,
    doc,
    getDocFromServer,
    getDocsFromServer,
    query,
    where,
    writeBatch
} from "firebase/firestore";
import {
    database,
    getFirebaseTimestamp,
    projectLastModified,
    projects
} from "@config/firestore";
import type { IDocument } from "./types";

export interface SaveAsProject {
    id: string;
    name: string;
    isPublic: boolean;
}
export interface SaveAsEntry {
    id: string;
    name: string;
    type: string;
    path: string[];
    pending?: boolean;
}
export interface SaveAsRequest {
    projectUid: string;
    filename: string;
    value: string;
    path: string[];
    folders: SaveAsEntry[];
}

export const sameFolder = (left: string[], right: string[]) =>
    left.length === right.length &&
    left.every((id, index) => id === right[index]);

export function nameError(name: string): string | undefined {
    if (!name.trim()) return "Enter a name.";
    if (
        name === "." ||
        name === ".." ||
        name !== name.trim() ||
        /[/\\]/u.test(name) ||
        [...name].some(
            (character) =>
                character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
        )
    )
        return "Use a name without slashes or leading or trailing spaces.";
    if (new TextEncoder().encode(name).length > 255)
        return "Keep the name under 256 bytes.";
}

export function destinationError(
    name: string,
    path: string[],
    entries: SaveAsEntry[]
) {
    return (
        nameError(name) ||
        (entries.some(
            (entry) => entry.name === name && sameFolder(entry.path, path)
        )
            ? "That name already exists in this folder. Choose another name."
            : undefined)
    );
}

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

/** Check fresh cloud data before creating a copy. Never update the source file. */
export async function saveTextAs(uid: string, request: SaveAsRequest) {
    const { projectUid, filename, value, path, folders } = request;
    // Leave room for Firestore's document fields below its 1 MiB document limit.
    if (new TextEncoder().encode(value).length > 1_000_000)
        throw new Error("This text is too large to save. Keep it under 1 MB.");
    const { project, entries } = await loadSaveAsDestination(uid, projectUid);
    const newFolders: SaveAsEntry[] = [];
    for (const [index, id] of path.entries()) {
        const parent = path.slice(0, index);
        const existing = entries.find((entry) => entry.id === id);
        if (existing) {
            if (
                existing.type !== "folder" ||
                !sameFolder(existing.path, parent)
            )
                throw new Error(
                    "The destination folder moved. Choose it again."
                );
        } else {
            const folder = folders.find(
                (entry) => entry.id === id && entry.pending
            );
            if (!folder || !sameFolder(folder.path, parent))
                throw new Error(
                    "The destination folder was removed. Choose another folder."
                );
            const error = destinationError(folder.name, parent, [
                ...entries,
                ...newFolders
            ]);
            if (error) throw new Error(error);
            newFolders.push(folder);
        }
    }
    const error = destinationError(filename, path, [...entries, ...newFolders]);
    if (error) throw new Error(error);
    requireUser(uid);
    const files = collection(doc(projects, projectUid), "files");
    const file = doc(files);
    const batch = writeBatch(database);
    const created: IDocument[] = [];
    const add = (
        id: string,
        name: string,
        type: "txt" | "folder",
        folderPath: string[],
        text = ""
    ) => {
        batch.set(doc(files, id), {
            name,
            type,
            path: folderPath,
            value: text,
            userUid: uid,
            created: getFirebaseTimestamp(),
            lastModified: getFirebaseTimestamp()
        });
        created.push({
            documentUid: id,
            filename: name,
            type,
            path: folderPath,
            userUid: uid,
            currentValue: text,
            savedValue: text,
            isModifiedLocally: false,
            created: undefined,
            lastModified: undefined
        });
    };
    for (const folder of newFolders)
        add(folder.id, folder.name, "folder", folder.path);
    add(file.id, filename, "txt", path, value);
    batch.set(
        doc(projectLastModified, projectUid),
        { timestamp: getFirebaseTimestamp() },
        { merge: true }
    );
    // Canceling the dialog before this point leaves no empty folders behind.
    await batch.commit();
    return { project, documentUid: file.id, documents: created };
}
