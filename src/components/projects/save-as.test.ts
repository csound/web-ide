import { beforeEach, expect, it, vi } from "vitest";
import {
    destinationError,
    listSaveAsProjects,
    loadSaveAsDestination,
    nameError,
    saveTextAs,
    type SaveAsRequest
} from "./save-as";
const mock = vi.hoisted(() => ({
    uid: "owner" as string | undefined,
    getProject: vi.fn(),
    getFiles: vi.fn(),
    call: vi.fn(),
    callable: vi.fn()
}));
vi.mock("firebase/auth", () => ({
    getAuth: () => ({ currentUser: mock.uid ? { uid: mock.uid } : null })
}));
vi.mock("../../config/firestore", () => ({ projects: "projects" }));
vi.mock("firebase/firestore", () => ({
    doc: (...parts: string[]) => parts.join("/"),
    collection: (...parts: string[]) => parts.join("/"),
    getDocFromServer: mock.getProject,
    getDocsFromServer: mock.getFiles,
    query: (...parts: unknown[]) => parts,
    where: (...parts: unknown[]) => parts
}));
vi.mock("firebase/functions", () => ({
    getFunctions: () => "functions",
    httpsCallable: mock.callable
}));
const request: SaveAsRequest = {
    projectUid: "dest",
    filename: "copy.csd",
    value: "unsaved source",
    path: [],
    folders: []
};
beforeEach(() => {
    vi.resetAllMocks();
    mock.uid = "owner";
    mock.callable.mockReturnValue(mock.call);
    mock.call.mockResolvedValue({
        data: {
            project: { id: "dest", name: "Other project", isPublic: true },
            documentUid: "copy",
            entries: [{ id: "copy", name: "copy.csd", type: "txt", path: [] }]
        }
    });
    mock.getProject.mockResolvedValue({
        exists: () => true,
        data: () => ({ userUid: "owner", name: "Other project", public: true })
    });
    mock.getFiles.mockResolvedValue({ docs: [] });
});
it("sends current text to the callable and only exposes confirmed documents", async () => {
    const result = await saveTextAs("owner", request);
    expect(mock.callable).toHaveBeenCalledWith("functions", "save_as_file");
    expect(mock.call).toHaveBeenCalledWith(request);
    expect(mock.getFiles).not.toHaveBeenCalled();
    expect(result.documents).toEqual([
        expect.objectContaining({
            documentUid: "copy",
            currentValue: "unsaved source",
            savedValue: "unsaved source",
            isModifiedLocally: false
        })
    ]);
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
it("rejects an account change while loading destinations", async () => {
    mock.getFiles.mockImplementation(async () => {
        mock.uid = "other";
        return { docs: [] };
    });
    await expect(loadSaveAsDestination("owner", "dest")).rejects.toThrow(
        "Sign in again"
    );
});
it("does not send a save after the account changes", async () => {
    mock.uid = "other";
    await expect(saveTextAs("owner", request)).rejects.toThrow("Sign in again");
    expect(mock.call).not.toHaveBeenCalled();
});
it("keeps callable errors visible to the dialog", async () => {
    mock.call.mockRejectedValue(
        new Error(
            "That name already exists in this folder. Choose another name."
        )
    );
    await expect(saveTextAs("owner", request)).rejects.toThrow(
        "already exists"
    );
});
it.each([
    ["", "Enter a name."],
    [" ", "Enter a name."],
    [".", 'Choose a name other than "." or "..".'],
    ["..", 'Choose a name other than "." or "..".'],
    [" a", "Remove spaces from the start or end of the name."],
    ["a ", "Remove spaces from the start or end of the name."],
    ["a/b", "Use a name without forward or back slashes."],
    ["a\\b", "Use a name without forward or back slashes."],
    [
        "a\n",
        "Remove control characters such as tabs and line breaks from the name."
    ],
    [
        "\t",
        "Remove control characters such as tabs and line breaks from the name."
    ],
    [
        "a\t",
        "Remove control characters such as tabs and line breaks from the name."
    ],
    [
        "a\u007f",
        "Remove control characters such as tabs and line breaks from the name."
    ],
    ["é".repeat(128), "Keep the name under 256 bytes."]
])("explains invalid name %j", (name, message) =>
    expect(nameError(name)).toBe(message)
);
it("only reports clashes in the chosen folder", () => {
    const entries = [
        { id: "existing", name: "copy.csd", type: "txt", path: ["voices"] }
    ];
    expect(destinationError("copy.csd", [], entries)).toBeUndefined();
    expect(destinationError("copy.csd", ["voices"], entries)).toContain(
        "already exists"
    );
});
