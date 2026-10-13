import { beforeEach, expect, it, vi } from "vitest";
import {
    destinationError,
    listSaveAsProjects,
    saveTextAs,
    type SaveAsEntry,
    type SaveAsRequest
} from "./save-as";

const mock = vi.hoisted(() => ({
    uid: "owner" as string | undefined,
    getProject: vi.fn(),
    getFiles: vi.fn(),
    set: vi.fn(),
    commit: vi.fn()
}));
vi.mock("firebase/auth", () => ({
    getAuth: () => ({ currentUser: mock.uid ? { uid: mock.uid } : null })
}));
vi.mock("../../config/firestore", () => ({
    database: "db",
    projects: "projects",
    projectLastModified: "dates",
    getFirebaseTimestamp: () => "server-time"
}));
vi.mock("firebase/firestore", () => ({
    doc: (...parts: string[]) =>
        parts.length === 1 ? { id: "new-file" } : parts.join("/"),
    collection: (...parts: string[]) => parts.join("/"),
    getDocFromServer: mock.getProject,
    getDocsFromServer: mock.getFiles,
    query: (...parts: unknown[]) => parts,
    where: (...parts: unknown[]) => parts,
    writeBatch: () => ({ set: mock.set, commit: mock.commit })
}));
const request: SaveAsRequest = {
    projectUid: "dest",
    filename: "copy.csd",
    value: "unsaved source",
    path: ["voices"],
    folders: []
};
const folder: SaveAsEntry = {
    id: "voices",
    name: "voices",
    type: "folder",
    path: []
};
function files(entries: SaveAsEntry[]) {
    return {
        docs: entries.map(({ id, ...data }) => ({ id, data: () => data }))
    };
}
beforeEach(() => {
    vi.resetAllMocks();
    mock.uid = "owner";
    mock.getProject.mockResolvedValue({
        exists: () => true,
        data: () => ({ userUid: "owner", name: "Other project", public: true })
    });
    mock.getFiles.mockResolvedValue(files([folder]));
    mock.commit.mockResolvedValue(undefined);
});
it("copies current text and selected new folders in one batch without touching the source", async () => {
    const pending = {
        id: "new-folder",
        name: "Bass",
        type: "folder",
        path: ["voices"],
        pending: true
    };
    const result = await saveTextAs("owner", {
        ...request,
        path: ["voices", "new-folder"],
        folders: [pending, { ...pending, id: "unused", name: "Unused" }]
    });
    expect(mock.set.mock.calls.map(([ref]) => ref)).toEqual([
        "projects/dest/files/new-folder",
        "projects/dest/files/new-file",
        "dates/dest"
    ]);
    expect(mock.set).toHaveBeenCalledWith(
        "projects/dest/files/new-file",
        expect.objectContaining({
            value: "unsaved source",
            name: "copy.csd",
            type: "txt",
            path: ["voices", "new-folder"],
            userUid: "owner"
        })
    );
    expect(mock.commit).toHaveBeenCalledOnce();
    expect(result.documents).toHaveLength(2);
    expect(result.project.isPublic).toBe(true);
});
it("queries only owned projects, not all public projects", async () => {
    mock.getFiles.mockResolvedValue({
        docs: [
            { id: "b", data: () => ({ name: "B", public: true }) },
            { id: "a", data: () => ({ name: "A" }) }
        ]
    });
    expect(await listSaveAsProjects("owner")).toEqual([
        { id: "a", name: "A", isPublic: false },
        { id: "b", name: "B", isPublic: true }
    ]);
    expect(mock.getFiles).toHaveBeenCalledWith([
        "projects",
        ["userUid", "==", "owner"]
    ]);
});
it.each(["visitor", undefined])(
    "refuses writes when the project owner is %s",
    async (owner) => {
        mock.getProject.mockResolvedValue({
            exists: () => !!owner,
            data: () => ({ userUid: owner })
        });
        await expect(saveTextAs("owner", request)).rejects.toThrow(
            "write access"
        );
        expect(mock.commit).not.toHaveBeenCalled();
    }
);
it("rejects an account change while loading", async () => {
    mock.getFiles.mockImplementation(async () => {
        mock.uid = "other";
        return files([folder]);
    });
    await expect(saveTextAs("owner", request)).rejects.toThrow("Sign in again");
    expect(mock.commit).not.toHaveBeenCalled();
});
it.each(["txt", "folder"])(
    "rejects a fresh name clash with a %s",
    async (type) => {
        mock.getFiles.mockResolvedValue(
            files([
                folder,
                { id: "taken", name: "copy.csd", type, path: ["voices"] }
            ])
        );
        await expect(saveTextAs("owner", request)).rejects.toThrow(
            "already exists"
        );
        expect(mock.commit).not.toHaveBeenCalled();
    }
);
it("allows the same filename in different folders", async () => {
    mock.getFiles.mockResolvedValue(
        files([
            folder,
            { id: "taken", name: "copy.csd", type: "txt", path: [] }
        ])
    );
    await saveTextAs("owner", request);
    expect(mock.commit).toHaveBeenCalledOnce();
});
it.each([
    { entries: [] },
    { entries: [{ ...folder, path: ["moved"] }] },
    { entries: [{ ...folder, type: "txt" }] }
])("rejects a deleted, moved or replaced folder", async ({ entries }) => {
    mock.getFiles.mockResolvedValue(files(entries));
    await expect(saveTextAs("owner", request)).rejects.toThrow("folder");
    expect(mock.commit).not.toHaveBeenCalled();
});
it("checks pending folder names against fresh cloud data", async () => {
    await expect(
        saveTextAs("owner", {
            ...request,
            path: ["pending"],
            folders: [{ ...folder, id: "pending", pending: true }]
        })
    ).rejects.toThrow("already exists");
    expect(mock.commit).not.toHaveBeenCalled();
});
it.each(["", "..", ".", "a/b", "a\\b", " a", "a ", "a\n", "é".repeat(128)])(
    "rejects invalid name %j",
    (name) => {
        expect(destinationError(name, [], [])).toBeTruthy();
    }
);
it("reports write failure without pretending a copy exists", async () => {
    mock.commit.mockRejectedValue(new Error("Permission denied"));
    await expect(saveTextAs("owner", request)).rejects.toThrow(
        "Permission denied"
    );
});
