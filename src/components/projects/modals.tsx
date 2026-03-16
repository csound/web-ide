import React, { useCallback, useState } from "react";
import { getAuth } from "firebase/auth";
import { uploadBytesResumable } from "firebase/storage";
import { useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { pathOr, isEmpty, values } from "ramda";
import { some } from "lodash";
import { formatFileSize } from "@root/utils";
import { updateProjectLastModified } from "@comp/project-last-modified/actions";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    updateDoc,
    writeBatch
} from "firebase/firestore";
import {
    database,
    getFirebaseTimestamp,
    projects,
    storageReference
} from "@config/firestore";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import { tabOpenByDocumentUid } from "@comp/project-editor/actions";
import { closeModal } from "../modal/actions";
import { newEmptyDocumentAction, renameDocumentLocally } from "./actions";
import * as SS from "./styles";
import { IProject, IDocument } from "./types";
import { textOrBinary } from "./utils";
import { useDispatch } from "@root/store";

export function DeleteDocumentPrompt({
    filename,
    isFolder,
    folderContents,
    documentUid,
    projectUid
}: {
    filename: string;
    isFolder: boolean;
    folderContents: IDocument[];
    documentUid: string;
    projectUid: string;
}) {
    const dispatch = useDispatch();
    const cancelCallback = () => dispatch(closeModal());
    const deleteFileCallback = useCallback(async () => {
        await deleteDoc(
            doc(collection(doc(projects, projectUid), "files"), documentUid)
        );
        await updateProjectLastModified(projectUid);
        dispatch(closeModal());
    }, [projectUid, documentUid, dispatch]);

    const deleteFolderCallback = useCallback(async () => {
        const batch = writeBatch(database);
        folderContents.forEach((document__) => {
            batch.delete(
                doc(
                    collection(doc(projects, projectUid), "files"),
                    document__.documentUid
                )
            );
        });
        batch.commit().then(() => {
            dispatch(closeModal());
            updateProjectLastModified(projectUid);
        });
    }, [projectUid, dispatch, folderContents]);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <h3>
                {isFolder
                    ? `Delete${
                          folderContents.length === 0 ? " empty" : ""
                      } directory ${filename}?`
                    : "Confirm deletion of file: " + filename}
            </h3>
            {folderContents.length > 0 && (
                <>
                    <p>{`Warning! Deleting directory ${filename} will also permenantly delete the following files:`}</p>
                    <ul>
                        {folderContents.map((item, index) => (
                            <li key={index}>{item.filename}</li>
                        ))}
                    </ul>
                </>
            )}

            <Button
                variant="outlined"
                color="primary"
                onClick={() => cancelCallback()}
                style={{ marginTop: 12 }}
            >
                Cancel
            </Button>
            <Button
                variant="outlined"
                color="secondary"
                onClick={() =>
                    isFolder ? deleteFolderCallback() : deleteFileCallback()
                }
                style={{ marginTop: 12 }}
            >
                Delete
            </Button>
        </div>
    );
}

// https://stackoverflow.com/questions/11100821/javascript-regex-for-validating-filenames
const isValidFolderName = (name: string) =>
    !/^(con|prn|aux|nul|com\d|lpt\d)$|(["*/:<>?\\|])|([\s.])$/i.test(name);

export function NewFolderPrompt({ projectUid }: { projectUid: string }) {
    const [input, setInput] = useState("");
    const [nameCollides, setNameCollides] = useState(false);
    const dispatch = useDispatch();
    const project: IProject = useSelector(
        pathOr({} as IProject, ["ProjectsReducer", "projects", projectUid])
    );

    const reservedFilenames = project.documents
        ? (values(project.documents) as IDocument[]).map(
              (document_) => document_.filename
          )
        : [];

    const newFolderSuccessCallback = useCallback(async () => {
        if (!isEmpty(project)) {
            const currentUser = getAuth().currentUser;
            const uid = currentUser ? currentUser.uid : "";
            const document_ = {
                type: "folder",
                name: input,
                userUid: uid,
                path: [],
                lastModified: getFirebaseTimestamp(),
                created: getFirebaseTimestamp()
            };
            await addDoc(
                collection(doc(projects, projectUid), "files"),
                document_
            );
            updateProjectLastModified(projectUid);
        }
        dispatch(closeModal());
    }, [dispatch, input, project, projectUid]);

    const shouldDisable = isEmpty(input) || !isValidFolderName(input);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <TextField
                label={nameCollides ? input + " already exists!" : "New Folder"}
                onKeyDown={(event_) =>
                    event_.key === "Enter" &&
                    !shouldDisable &&
                    newFolderSuccessCallback()
                }
                error={nameCollides}
                value={input}
                onChange={(event) => {
                    setInput(event.target.value);
                    setNameCollides(
                        some(
                            reservedFilenames,
                            (function_) => function_ === event.target.value
                        )
                    );
                }}
            />
            <Button
                css={SS.modalSubmitButton}
                variant="outlined"
                color={shouldDisable ? undefined : "primary"}
                disabled={shouldDisable || nameCollides}
                onClick={newFolderSuccessCallback}
                style={{ marginTop: 11 }}
            >
                {"Create"}
            </Button>
        </div>
    );
}
export function NewDocumentPrompt({
    isRenameAction,
    initFilename,
    renameDocumentUid,
    projectUid
}: {
    isRenameAction: boolean;
    initFilename: string;
    renameDocumentUid?: string;
    projectUid: string;
}) {
    const [input, setInput] = useState(isRenameAction ? initFilename : "");
    const [nameCollides, setNameCollides] = useState(false);
    const dispatch = useDispatch();

    const project: IProject = useSelector(
        pathOr({} as IProject, ["ProjectsReducer", "projects", projectUid])
    );

    const reservedFilenames = project.documents
        ? (values(project.documents) as IDocument[]).map(
              (document_) => document_.filename
          )
        : [];

    const shouldDisable = isEmpty(input);

    const newDocumentSuccessCallback = useCallback(async () => {
        if (!isEmpty(project)) {
            const currentUser = getAuth().currentUser;
            const uid = currentUser ? currentUser.uid : "";
            const document_ = {
                type: "txt",
                name: input,
                value: "",
                userUid: uid,
                lastModified: getFirebaseTimestamp(),
                created: getFirebaseTimestamp(),
                path: []
            };
            const result = await addDoc(
                collection(doc(projects, project.projectUid), "files"),
                document_
            );

            const documentUid = result.id;
            dispatch(tabOpenByDocumentUid(result.id, projectUid));
            dispatch(newEmptyDocumentAction(projectUid, documentUid, input));
            updateProjectLastModified(project.projectUid);
            dispatch(closeModal());
        }
        dispatch(closeModal());
    }, [projectUid, input, dispatch, project]);

    const renameDocumentSuccessCallback = useCallback(async () => {
        if (renameDocumentUid) {
            await updateDoc(
                doc(
                    collection(doc(projects, projectUid), "files"),
                    renameDocumentUid
                ),
                { name: input } as any
            );

            dispatch(renameDocumentLocally(renameDocumentUid, input));
            updateProjectLastModified(projectUid);
            dispatch(closeModal());
        }
    }, [dispatch, input, projectUid, renameDocumentUid]);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <TextField
                label={
                    nameCollides ? input + " already exists!" : "New filename"
                }
                // onKeyDown={(event_) =>
                //     event_.key === "Enter" && !shouldDisable && isRenameAction
                //         ? renameDocumentSuccessCallback()
                //         : newDocumentSuccessCallback()
                // }
                error={nameCollides}
                value={input}
                onChange={(event) => {
                    setInput(event.target.value);
                    setNameCollides(
                        some(
                            reservedFilenames,
                            (function_) => function_ === event.target.value
                        )
                    );
                }}
            />
            <Button
                css={SS.modalSubmitButton}
                variant="outlined"
                color={shouldDisable ? undefined : "primary"}
                disabled={shouldDisable || nameCollides}
                onClick={
                    isRenameAction
                        ? renameDocumentSuccessCallback
                        : newDocumentSuccessCallback
                }
                style={{ marginTop: 11 }}
            >
                {isRenameAction ? "Rename" : "Create"}
            </Button>
        </div>
    );
}

export function AddDocumentPrompt({ projectUid }: { projectUid: string }) {
    const dispatch = useDispatch();
    const [files, setFiles] = useState(null as FileList | null);
    const [filesToUpload, setFilesToUpload] = useState([] as File[]);
    const [uploadingIndex, setUploadingIndex] = useState(-1);

    const [nameCollides, setNameCollides] = useState(false);

    const project: IProject = useSelector(
        pathOr({} as IProject, ["ProjectsReducer", "projects", projectUid])
    );

    const uploadFilePromise = (
        file: File,
        uid: string,
        filename: string,
        fileType: string,
        project: IProject
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (fileType === "txt") {
                const reader = new FileReader();
                reader.addEventListener("load", async () => {
                    try {
                        const txt = reader.result;
                        const document_ = {
                            type: fileType,
                            name: filename,
                            value: txt,
                            userUid: uid,
                            lastModified: getFirebaseTimestamp(),
                            created: getFirebaseTimestamp()
                        };

                        const result = await addDoc(
                            collection(
                                doc(projects, project.projectUid),
                                "files"
                            ),
                            document_
                        );

                        const documentUid = result.id;
                        dispatch(tabOpenByDocumentUid(documentUid, projectUid));
                        dispatch(
                            newEmptyDocumentAction(
                                projectUid,
                                documentUid,
                                filename
                            )
                        );
                        updateProjectLastModified(project.projectUid);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
                reader.addEventListener("error", () => {
                    reject(new Error(`Failed to read file: ${filename}`));
                });
                reader.readAsText(file);
            } else if (fileType === "bin") {
                // generate UUID
                const documentId = uuidv4();

                const metadata = {
                    cacheControl: "public,max-age=31536000,immutable",
                    customMetadata: {
                        filename,
                        projectUid,
                        userUid: uid,
                        docUid: documentId
                    }
                };

                storageReference(`${uid}/${project.projectUid}/${documentId}`)
                    .then((ref) => {
                        const uploadTask = uploadBytesResumable(
                            ref,
                            file,
                            metadata
                        );

                        uploadTask.on(
                            "state_changed",
                            (snapshot) => {
                                const progress =
                                    (snapshot.bytesTransferred /
                                        snapshot.totalBytes) *
                                    100;
                                console.log(
                                    `Upload ${filename} is ${progress}% done`
                                );
                                switch (snapshot.state) {
                                    case "paused": {
                                        console.log(
                                            `Upload ${filename} is paused`
                                        );
                                        break;
                                    }
                                    case "running": {
                                        console.log(
                                            `Upload ${filename} is running`
                                        );
                                        break;
                                    }
                                }
                            },
                            function (error: any) {
                                dispatch(
                                    openSnackbar(
                                        `Error uploading ${filename}: ${error.message}`,
                                        SnackbarType.Error
                                    )
                                );
                                reject(error);
                            },
                            function () {
                                // Upload completed successfully
                                console.log(
                                    `${filename} uploaded successfully`
                                );
                                resolve();
                            }
                        );
                    })
                    .catch(reject);
            }
        });
    };

    const addDocumentSuccessCallback = useCallback(async () => {
        if (!isEmpty(project) && filesToUpload.length > 0) {
            const currentUser = getAuth().currentUser;
            const uid = currentUser ? currentUser.uid : "";

            try {
                // Upload files sequentially
                for (let i = 0; i < filesToUpload.length; i++) {
                    setUploadingIndex(i);
                    const file = filesToUpload[i];
                    const filename = file.name;
                    const fileType = textOrBinary(file.name);

                    console.log(
                        `Uploading file ${i + 1}/${filesToUpload.length}: ${filename} (type: ${fileType})`
                    );

                    await uploadFilePromise(
                        file,
                        uid,
                        filename,
                        fileType,
                        project
                    );
                }

                dispatch(
                    openSnackbar(
                        `Successfully uploaded ${filesToUpload.length} file(s)`,
                        SnackbarType.Info
                    )
                );
                updateProjectLastModified(project.projectUid);
            } catch (error: any) {
                dispatch(
                    openSnackbar(
                        `Upload failed: ${error.message || "Unknown error"}`,
                        SnackbarType.Error
                    )
                );
            }
        }
        dispatch(closeModal());
    }, [dispatch, filesToUpload, projectUid, project]);

    const reservedFilenames = (values(project.documents) as IDocument[]).map(
        (document_) => document_.filename
    );

    const checkFileNameCollisions = (selectedFiles: File[]): boolean => {
        for (let i = 0; i < selectedFiles.length; i++) {
            const fileName = selectedFiles[i].name;
            if (reservedFilenames.includes(fileName)) {
                return true;
            }
        }
        return false;
    };

    const removeFileFromQueue = (index: number) => {
        const updated = filesToUpload.filter((_, i) => i !== index);
        setFilesToUpload(updated);
        setNameCollides(checkFileNameCollisions(updated));
    };

    const megabyte_limit = Math.pow(10, 6) * 2;
    const shouldDisable =
        filesToUpload.length === 0 ||
        filesToUpload.some((file) => file.size > megabyte_limit) ||
        nameCollides;

    const filesInfo =
        filesToUpload.length > 0
            ? filesToUpload.length === 1
                ? `${filesToUpload[0].name} (${formatFileSize(filesToUpload[0].size)})`
                : `${filesToUpload.length} files selected`
            : "Choose files...";

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <Button variant="contained" color="primary" component="label">
                {filesInfo}
                <input
                    id="fileSelector"
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={(event) => {
                        const selectedFiles: FileList | null =
                            event.target.files;
                        if (selectedFiles) {
                            const filesArray = Array.from(selectedFiles);
                            setFilesToUpload(filesArray);
                            setFiles(selectedFiles);
                            setNameCollides(
                                checkFileNameCollisions(filesArray)
                            );
                        }
                    }}
                ></input>
            </Button>
            <p>
                {filesToUpload.length > 0
                    ? `${filesToUpload.length} file(s) selected (Max per file is 2MB)`
                    : "Select file(s) (Max per file is 2MB)"}
            </p>

            {filesToUpload.length > 0 && (
                <div
                    style={{
                        border: "1px solid #e0e0e0",
                        borderRadius: "4px",
                        padding: "8px",
                        marginBottom: "12px",
                        maxHeight: "200px",
                        overflowY: "auto"
                    }}
                >
                    <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
                        Pending uploads:
                    </div>
                    {filesToUpload.map((file, index) => (
                        <div
                            key={index}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px",
                                backgroundColor:
                                    uploadingIndex === index
                                        ? "#6a6a6a"
                                        : "transparent",
                                borderRadius: "3px",
                                marginBottom: "4px",
                                fontSize: "0.9rem"
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {uploadingIndex === index && (
                                    <span
                                        style={{
                                            color: "#1976d2",
                                            marginRight: "8px",
                                            fontWeight: "bold"
                                        }}
                                    >
                                        ↑
                                    </span>
                                )}
                                <span style={{ wordBreak: "break-word" }}>
                                    {file.name} ({formatFileSize(file.size)})
                                </span>
                            </div>
                            <button
                                onClick={() => removeFileFromQueue(index)}
                                disabled={uploadingIndex !== -1}
                                style={{
                                    marginLeft: "8px",
                                    padding: "4px 8px",
                                    backgroundColor: "#ffebee",
                                    border: "1px solid #ef5350",
                                    borderRadius: "3px",
                                    cursor:
                                        uploadingIndex !== -1
                                            ? "not-allowed"
                                            : "pointer",
                                    color: "#c62828",
                                    fontWeight: "bold",
                                    opacity: uploadingIndex !== -1 ? 0.5 : 1,
                                    transition: "all 0.2s ease"
                                }}
                                title="Remove from queue"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Button
                variant="outlined"
                color="primary"
                disabled={shouldDisable}
                onClick={() =>
                    filesToUpload.length > 0 && addDocumentSuccessCallback()
                }
                style={{ marginTop: 11 }}
            >
                Upload
            </Button>
        </div>
    );
}
