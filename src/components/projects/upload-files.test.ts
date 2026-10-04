import { beforeEach, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { ProjectsReducer } from "./reducer";
import SnackbarReducer from "../snackbar/reducer";
import { uploadProjectFiles, MAX_PROJECT_FILE_BYTES } from "./upload-files";
import { STORE_PROJECT_LOCALLY } from "./types";

const mock = vi.hoisted(() => ({
    uid: "owner" as string | undefined,
    addDoc: vi.fn(),
    storageReference: vi.fn(),
    upload: vi.fn(),
    modified: vi.fn()
}));
vi.mock("firebase/auth", () => ({
    getAuth: () => ({ currentUser: mock.uid ? { uid: mock.uid } : null })
}));
vi.mock("firebase/firestore", () => ({
    addDoc: mock.addDoc,
    collection: (...parts: unknown[]) => parts,
    doc: (...parts: unknown[]) => parts
}));
vi.mock("firebase/storage", () => ({ uploadBytesResumable: mock.upload }));
vi.mock("../../config/firestore", () => ({
    projects: "projects",
    storageReference: mock.storageReference,
    getFirebaseTimestamp: () => "server-time"
}));
vi.mock("../project-last-modified/actions", () => ({
    updateProjectLastModified: mock.modified
}));

function setup() {
    const store = configureStore({
        reducer: { ProjectsReducer, SnackbarReducer }
    });
    store.dispatch({
        type: STORE_PROJECT_LOCALLY,
        projects: [
            {
                projectUid: "project",
                userUid: "owner",
                name: "Study",
                documents: {}
            }
        ]
    });
    return store;
}
function file(name: string, size = 3, value = "orc") {
    const result = new File([value], name);
    Object.defineProperty(result, "size", { value: size });
    Object.defineProperty(result, "text", {
        value: vi.fn().mockResolvedValue(value)
    });
    return result;
}
beforeEach(() => {
    vi.clearAllMocks();
    mock.uid = "owner";
    let id = 0;
    mock.addDoc.mockImplementation(async () => ({ id: `text-${++id}` }));
    mock.storageReference.mockResolvedValue("storage-ref");
    mock.upload.mockImplementation(() => ({
        on: (
            _: string,
            progress: (snapshot: {
                bytesTransferred: number;
                totalBytes: number;
            }) => void,
            _error: (error: Error) => void,
            done: () => void
        ) => {
            progress({ bytesTransferred: 3, totalBytes: 3 });
            done();
        }
    }));
    mock.modified.mockResolvedValue(undefined);
});

it("uploads mixed files, retains text, and adds every completed file to the tree", async () => {
    const store = setup();
    await store.dispatch(
        uploadProjectFiles("project", [file("study.csd"), file("sample.wav")])
    );
    expect(mock.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
            name: "study.csd",
            value: "orc",
            type: "txt"
        })
    );
    expect(mock.upload).toHaveBeenCalledWith(
        "storage-ref",
        expect.any(File),
        expect.objectContaining({
            customMetadata: expect.objectContaining({
                filename: "sample.wav",
                projectUid: "project",
                userUid: "owner"
            })
        })
    );
    expect(
        Object.values(
            store.getState().ProjectsReducer.projects.project.documents
        )
    ).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                filename: "study.csd",
                currentValue: "orc",
                savedValue: "orc",
                isModifiedLocally: false
            }),
            expect.objectContaining({ filename: "sample.wav", type: "bin" })
        ])
    );
    expect(mock.modified).toHaveBeenCalledWith("project");
});
it("checks the 2 MB boundary before reading or uploading, and keeps valid files", async () => {
    const store = setup();
    const oversized = file("large.csd", MAX_PROJECT_FILE_BYTES + 1);
    await store.dispatch(
        uploadProjectFiles("project", [
            oversized,
            file("limit.wav", MAX_PROJECT_FILE_BYTES)
        ])
    );
    expect(oversized.text).not.toHaveBeenCalled();
    expect(mock.addDoc).not.toHaveBeenCalled();
    expect(mock.upload).toHaveBeenCalledTimes(1);
    expect(store.getState().SnackbarReducer.text).toContain(
        "large.csd: exceeds 2 MB"
    );
});
it("reserves names across batches and within one multi-file drop", async () => {
    const store = setup();
    await store.dispatch(uploadProjectFiles("project", [file("sample.wav")]));
    await store.dispatch(
        uploadProjectFiles("project", [file("sample.wav"), file("sample.wav")])
    );
    expect(
        mock.upload.mock.calls.map((call) => call[2].customMetadata.filename)
    ).toEqual(["sample.wav", "sample(1).wav", "sample(2).wav"]);
});
it.each([undefined, "visitor"])("refuses uploads by %s", async (uid) => {
    const store = setup();
    mock.uid = uid;
    await store.dispatch(uploadProjectFiles("project", [file("study.csd")]));
    expect(mock.addDoc).not.toHaveBeenCalled();
    expect(mock.upload).not.toHaveBeenCalled();
});
it("continues after a failed file and reports the failure", async () => {
    const store = setup();
    mock.storageReference.mockRejectedValueOnce(new Error("Offline"));
    await store.dispatch(
        uploadProjectFiles("project", [file("failed.wav"), file("saved.csd")])
    );
    expect(
        Object.values(
            store.getState().ProjectsReducer.projects.project.documents
        )
    ).toHaveLength(1);
    expect(store.getState().SnackbarReducer.text).toContain(
        "1 file uploaded. 1 skipped. failed.wav: Offline"
    );
});
it("blocks overlapping batches and clears the lock after completion", async () => {
    const store = setup();
    let finish!: (value: { id: string }) => void;
    mock.addDoc.mockReturnValueOnce(
        new Promise((resolve) => {
            finish = resolve;
        })
    );
    const pending = store.dispatch(
        uploadProjectFiles("project", [file("first.csd")])
    );
    await vi.waitFor(() => expect(mock.addDoc).toHaveBeenCalledTimes(1));
    await store.dispatch(uploadProjectFiles("project", [file("second.csd")]));
    expect(mock.addDoc).toHaveBeenCalledTimes(1);
    finish({ id: "first" });
    await pending;
    await store.dispatch(uploadProjectFiles("project", [file("second.csd")]));
    expect(mock.addDoc).toHaveBeenCalledTimes(2);
});
