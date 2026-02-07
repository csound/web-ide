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

    const [nameCollides, setNameCollides] = useState(false);

    const project: IProject = useSelector(
        pathOr({} as IProject, ["ProjectsReducer", "projects", projectUid])
    );

    const addDocumentSuccessCallback = useCallback(async () => {
        if (!isEmpty(project) && files !== null && files.length > 0) {
            const file = files[0];
            const filename = file.name;
            const fileType = textOrBinary(file.name);
            const reader = new FileReader();
            const currentUser = getAuth().currentUser;
            const uid = currentUser ? currentUser.uid : "";

            console.log("File type found:", fileType);

            if (fileType === "txt") {
                reader.addEventListener("load", async () => {
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
                        collection(doc(projects, project.projectUid), "files"),
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

                const uploadTask = uploadBytesResumable(
                    await storageReference(
                        `${uid}/${project.projectUid}/${documentId}`
                    ),
                    file,
                    metadata
                );

                // Listen for state changes, errors, and completion of the upload.
                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        const progress =
                            (snapshot.bytesTransferred / snapshot.totalBytes) *
                            100;
                        console.log("Upload is " + progress + "% done");
                        switch (snapshot.state) {
                            case "paused": {
                                console.log("Upload is paused");
                                break;
                            }
                            case "running": {
                                console.log("Upload is running");
                                break;
                            }
                        }
                    },
                    function (error: any) {
                        dispatch(
                            openSnackbar(error.message, SnackbarType.Error)
                        );
                        // A full list of error codes is available at
                        // https://firebase.google.com/docs/storage/web/handle-errors
                        switch (error.name) {
                            case "storage/unauthorized": {
                                // User doesn't have permission to access the object
                                break;
                            }

                            case "storage/canceled": {
                                // User canceled the upload
                                break;
                            }

                            case "storage/unknown": {
                                // Unknown error occurred, inspect error.serverResponse
                                break;
                            }
                        }
                    },
                    function () {
                        // Upload completed successfully, now we can get the download URL
                        // uploadTask.snapshot.ref.getDownloadURL()
                        // cloud function updates firestore for file entry
                    }
                );
            }
        }
        dispatch(closeModal());
    }, [dispatch, files, projectUid, project]);

    const reservedFilenames = (values(project.documents) as IDocument[]).map(
        (document_) => document_.filename
    );

    const megabyte_limit = Math.pow(10, 6) * 2;
    const shouldDisable =
        !files || isEmpty(files) || files[0].size > megabyte_limit;
    const filesize = files ? formatFileSize(files[0].size) : "Select file";
    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <Button variant="contained" color="primary" component="label">
                {files ? `${files[0].name}` : "Choose file..."}
                <input
                    id="fileSelector"
                    type="file"
                    style={{ display: "none" }}
                    onChange={(event) => {
                        const files: FileList | null = event.target.files;
                        const fileName = files ? files[0].name : "";
                        files && setFiles(files);
                        setNameCollides(
                            some(
                                reservedFilenames,
                                (function_) => function_ === fileName
                            )
                        );
                    }}
                ></input>
            </Button>
            <p>{`File Size: ${filesize} (Max file size is 2MB)`}</p>
            <Button
                variant="outlined"
                color="primary"
                disabled={shouldDisable || nameCollides}
                onClick={() => files && addDocumentSuccessCallback()}
                style={{ marginTop: 11 }}
            >
                Upload
            </Button>
        </div>
    );
}
