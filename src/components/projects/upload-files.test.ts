import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { ProjectsReducer } from "./reducer";
import SnackbarReducer from "../snackbar/reducer";
import { uploadProjectFiles, MAX_PROJECT_FILE_BYTES } from "./upload-files";
import { ADD_PROJECT_DOCUMENTS, STORE_PROJECT_LOCALLY } from "./types";

const mock = vi.hoisted(() => ({
    uid: "owner" as string | undefined,
    addDoc: vi.fn(),
    onSnapshot: vi.fn(),
    unsubscribe: vi.fn(),
    storageReference: vi.fn(),
    upload: vi.fn(),
    modified: vi.fn()
}));
vi.mock("firebase/auth", () => ({
    getAuth: () => ({ currentUser: mock.uid ? { uid: mock.uid } : null })
}));
vi.mock("firebase/firestore", () => ({
    addDoc: mock.addDoc,
    onSnapshot: mock.onSnapshot,
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
function snapshot(
    id: string,
    name = "sample.wav",
    metadata = { fromCache: false, hasPendingWrites: false }
) {
    return {
        id,
        exists: () => true,
        metadata,
        data: () => ({
            name,
            type: "bin",
            userUid: "owner",
            value: "",
            created: { toMillis: () => 123 },
            lastModified: { toMillis: () => 123 }
        })
    };
}

afterEach(() => vi.useRealTimers());
beforeEach(() => {
    vi.resetAllMocks();
    mock.onSnapshot.mockImplementation((reference, _options, next) => {
        const id = reference.at(-1);
        const upload = mock.upload.mock.calls.find(
            (call) => call[2].customMetadata.docUid === id
        );
        next(snapshot(id, upload[2].customMetadata.filename));
        return mock.unsubscribe;
    });
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

it("checks current filenames before each file in a batch", async () => {
    const store = setup();
    let finish!: (value: { id: string }) => void;
    mock.addDoc.mockReturnValueOnce(
        new Promise((resolve) => {
            finish = resolve;
        })
    );
    const pending = store.dispatch(
        uploadProjectFiles("project", [file("first.csd"), file("later.csd")])
    );
    await vi.waitFor(() => expect(mock.addDoc).toHaveBeenCalledOnce());
    store.dispatch({
        type: ADD_PROJECT_DOCUMENTS,
        projectUid: "project",
        documents: {
            concurrent: {
                documentUid: "concurrent",
                filename: "later.csd",
                type: "txt",
                path: []
            }
        }
    });
    finish({ id: "first" });
    await pending;
    expect(mock.addDoc.mock.calls[1][1].name).toBe("later(1).csd");
});

it("waits for a server-confirmed binary record before adding an editable row", async () => {
    const store = setup();
    const onUploaded = vi.fn();
    mock.onSnapshot.mockReturnValue(mock.unsubscribe);
    const pending = store.dispatch(
        uploadProjectFiles(
            "project",
            [file("sample.wav")],
            undefined,
            onUploaded
        )
    );
    await vi.waitFor(() => expect(mock.onSnapshot).toHaveBeenCalledOnce());
    const [reference, options, next] = mock.onSnapshot.mock.calls[0];
    expect(options).toEqual({ includeMetadataChanges: true });
    next({ exists: () => false });
    next(
        snapshot(reference.at(-1), "sample.wav", {
            fromCache: true,
            hasPendingWrites: false
        })
    );
    next(
        snapshot(reference.at(-1), "sample.wav", {
            fromCache: false,
            hasPendingWrites: true
        })
    );
    await Promise.resolve();
    expect(store.getState().ProjectsReducer.projects.project.documents).toEqual(
        {}
    );
    expect(onUploaded).not.toHaveBeenCalled();
    next(snapshot(reference.at(-1)));
    await pending;
    expect(
        store.getState().ProjectsReducer.projects.project.documents[
            reference.at(-1)
        ]
    ).toMatchObject({
        filename: "sample.wav",
        created: 123,
        lastModified: 123
    });
    expect(onUploaded).toHaveBeenCalledWith(reference.at(-1), "bin");
    expect(mock.unsubscribe).toHaveBeenCalledOnce();
});

it("releases the listener and batch lock if the file record never arrives", async () => {
    vi.useFakeTimers();
    const store = setup();
    const progress = vi.fn();
    mock.onSnapshot.mockReturnValue(mock.unsubscribe);
    const pending = store.dispatch(
        uploadProjectFiles("project", [file("sample.wav")], progress)
    );
    await vi.advanceTimersByTimeAsync(60_000);
    await pending;
    expect(store.getState().ProjectsReducer.projects.project.documents).toEqual(
        {}
    );
    expect(store.getState().SnackbarReducer.text).toContain("1 file uploaded.");
    expect(store.getState().SnackbarReducer.text).toContain(
        "sample.wav: uploaded, but not ready to use."
    );
    expect(progress).toHaveBeenLastCalledWith(undefined);
    expect(mock.unsubscribe).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    await store.dispatch(uploadProjectFiles("project", [file("later.csd")]));
    expect(mock.addDoc).toHaveBeenCalledOnce();
});

it("reports record listener errors without exposing a binary row or blocking later files", async () => {
    const store = setup();
    mock.onSnapshot.mockImplementation((_reference, _options, _next, fail) => {
        fail(new Error("Permission denied"));
        return mock.unsubscribe;
    });
    await store.dispatch(
        uploadProjectFiles("project", [file("sample.wav"), file("later.csd")])
    );
    expect(
        Object.values(
            store.getState().ProjectsReducer.projects.project.documents
        )
    ).toEqual([expect.objectContaining({ filename: "later.csd" })]);
    expect(store.getState().SnackbarReducer.text).toContain(
        "2 files uploaded."
    );
    expect(store.getState().SnackbarReducer.text).toContain(
        "Permission denied"
    );
    expect(mock.unsubscribe).toHaveBeenCalledOnce();
});

it("keeps file failures in the summary when the last-edited date cannot be saved", async () => {
    const store = setup();
    mock.modified.mockRejectedValue(new Error("Offline"));
    await store.dispatch(
        uploadProjectFiles("project", [
            file("large.csd", MAX_PROJECT_FILE_BYTES + 1),
            file("saved.csd")
        ])
    );
    expect(store.getState().SnackbarReducer.text).toBe(
        "1 file uploaded. 1 skipped. large.csd: exceeds 2 MB. The last-edited date could not be saved."
    );
});
