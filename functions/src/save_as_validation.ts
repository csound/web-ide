/** Shared by the dialog and the callable so both explain invalid names alike. */
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
export interface SaveAsResult {
    project: SaveAsProject;
    documentUid: string;
    entries: SaveAsEntry[];
}

export const sameFolder = (left: string[], right: string[]) =>
    left.length === right.length &&
    left.every((id, index) => id === right[index]);

export function nameError(name: string): string | undefined {
    if (name === "." || name === "..")
        return 'Choose a name other than "." or "..".';
    if (
        [...name].some(
            (character) =>
                character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
        )
    )
        return "Remove control characters such as tabs and line breaks from the name.";
    if (!name.trim()) return "Enter a name.";
    if (name !== name.trim())
        return "Remove spaces from the start or end of the name.";
    if (/[/\\]/u.test(name))
        return "Use a name without forward or back slashes.";
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

const validId = (id: unknown): id is string =>
    typeof id === "string" &&
    !!id &&
    id !== "." &&
    id !== ".." &&
    !id.includes("/") &&
    !/^__.*__$/u.test(id) &&
    new TextEncoder().encode(id).length <= 1500;
const validPath = (path: unknown): path is string[] =>
    Array.isArray(path) &&
    path.length <= 100 &&
    path.every(validId) &&
    new Set(path).size === path.length;

export function requestError(data: unknown): string | undefined {
    if (!data || typeof data !== "object")
        return "Choose a destination and file name.";
    const request = data as Partial<SaveAsRequest>;
    if (!validId(request.projectUid) || !validPath(request.path))
        return "Choose a valid destination folder (up to 100 levels).";
    if (typeof request.filename !== "string") return "Enter a file name.";
    const error = nameError(request.filename);
    if (error) return error;
    if (typeof request.value !== "string") return "Provide text for the copy.";
    if (
        new TextEncoder().encode(
            JSON.stringify({
                name: request.filename,
                value: request.value,
                path: request.path
            })
        ).length > 1_000_000
    )
        return "This text is too large to save. Keep it under 1 MB.";
    if (
        !Array.isArray(request.folders) ||
        request.folders.length > 100 ||
        request.folders.some(
            (folder) =>
                !folder ||
                !validId(folder.id) ||
                folder.type !== "folder" ||
                folder.pending !== true ||
                typeof folder.name !== "string" ||
                !!nameError(folder.name) ||
                !validPath(folder.path)
        ) ||
        new Set(request.folders.map((folder) => folder.id)).size !==
            request.folders.length
    )
        return "Check the new folder names and paths (up to 100 folders).";
}
