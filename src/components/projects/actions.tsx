import { AppThunkDispatch, RootState, store } from "@root/store";
import { getDownloadURL } from "firebase/storage";
import {
    collection,
    doc,
    DocumentData,
    DocumentReference,
    getDoc,
    getDocs,
    updateDoc,
    writeBatch
} from "firebase/firestore";
import { push } from "connected-react-router";
import { CsoundObj } from "@csound/browser";
import { tabDockInit } from "@comp/project-editor/actions";
import {
    selectDefaultTargetName,
    selectTarget
} from "@comp/target-controls/selectors";
import { selectLoggedInUid } from "@comp/login/selectors";
import { updateProjectLastModified } from "@comp/project-last-modified/actions";
import { selectTabDockIndex } from "@comp/project-editor/selectors";
import { openSimpleModal } from "../modal/actions";
import { filter as _filter, find, isEmpty } from "lodash";
import {
    append,
    assoc,
    concat,
    filter,
    forEach,
    path,
    pathOr,
    reduce,
    values
} from "ramda";
import {
    ACTIVATE_PROJECT,
    ADD_PROJECT_DOCUMENTS,
    DOCUMENT_INITIALIZE,
    DOCUMENT_RESET,
    DOCUMENT_RENAME_LOCALLY,
    DOCUMENT_REMOVE_LOCALLY,
    DOCUMENT_SAVE,
    DOCUMENT_UPDATE_VALUE,
    DOCUMENT_UPDATE_MODIFIED_LOCALLY,
    CLOSE_PROJECT,
    SET_PROJECT_PUBLIC,
    STORE_PROJECT_LOCALLY,
    UNSET_PROJECT,
    IProject,
    IDocument,
    CsoundFile
} from "./types";
import { ITarget } from "@comp/target-controls/types";
import {
    addDocumentToCsoundFS,
    convertProjectSnapToProject,
    fileDocumentDataToDocumentType
} from "./utils";
import {
    database,
    getFirebaseTimestamp,
    projects,
    storageReference
} from "@config/firestore";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { IFirestoreDocument } from "@root/db/types";

export const downloadProjectOnce = (
    projectUid: string
): ((dispatch: any) => Promise<void>) => {
    if (!projectUid) {
        console.trace("No projectUid provided");
    }
    return async (dispatch: any) => {
        console.log("Getting project", projectUid);
        if (!projectUid) {
            console.trace("Missing projectUid", projectUid);
            return;
        }
        if (!projects) {
            console.trace("Missing projects collection", projects);
            return;
        }
        let projReference: DocumentReference<DocumentData>;
        try {
            projReference = doc(projects, projectUid);
        } catch {
            return;
        }

        if (!projReference) {
            console.trace("Missing project reference", projReference);
            return;
        }

        let projSnap: any;
        try {
            projSnap = await getDoc(projReference);
        } catch {
            return;
        }
        if (projSnap && projSnap.exists) {
            const project: IProject =
                await convertProjectSnapToProject(projSnap);
            await dispatch(storeProjectLocally([project]));
        }
    };
};

export const downloadAllProjectDocumentsOnce = (
    projectUid: string
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        const filesReference = await getDocs(
            collection(doc(projects, projectUid), "files")
        );
        const allDocuments = await Promise.all(
            filesReference.docs.map(async (d) => {
                const data = d.data() as IFirestoreDocument;
                return fileDocumentDataToDocumentType(
                    {
                        ...data
                    },
                    d.id
                );
            })
        );
        const allDocumentsMap = reduce(
            (accumulator, document_) =>
                assoc(document_.documentUid, document_, accumulator),
            {},
            allDocuments
        );

        await dispatch({
            type: ADD_PROJECT_DOCUMENTS,
            projectUid,
            documents: allDocumentsMap
        });
    };
};

export const newEmptyDocumentAction = (
    projectUid: string,
    documentUid: string,
    filename: string
): {
    type: typeof DOCUMENT_INITIALIZE;
    filename: string;
    documentUid: string;
    projectUid: string;
} => ({
    type: DOCUMENT_INITIALIZE,
    filename,
    documentUid,
    projectUid
});

export const closeProject = () => {
    return {
        type: CLOSE_PROJECT
    };
};

export const activateProject = (projectUid: string) => {
    return async (dispatch: AppThunkDispatch) => {
        dispatch({
            type: ACTIVATE_PROJECT,
            projectUid
        });
    };
};

export const storeProjectLocally = (projects: Array<IProject>) => {
    const projectsWithoutTimestamps = projects.map((project) => ({
        ...project,
        created: project.created?.toMillis() || undefined
    }));
    return {
        type: STORE_PROJECT_LOCALLY,
        projects: projectsWithoutTimestamps
    };
};

export const unsetProject = (projectUid: string) => {
    return {
        type: UNSET_PROJECT,
        projectUid
    };
};

export const addProjectDocuments = (
    projectUid: string,
    documents: Record<string, IDocument>
) => {
    return async (dispatch: AppThunkDispatch, getState: () => RootState) => {
        const store: RootState = getState();
        const tabIndex: number = selectTabDockIndex(store);
        dispatch({
            type: ADD_PROJECT_DOCUMENTS,
            projectUid,
            documents
        });
        if (tabIndex < 0) {
            const maybeDefaultTargetName: string | undefined =
                selectDefaultTargetName(projectUid)(store);

            const maybeDefaultTarget: ITarget | undefined = selectTarget(
                projectUid,
                maybeDefaultTargetName
            )(store);

            dispatch(
                tabDockInit(projectUid, values(documents), maybeDefaultTarget)
            );
        }
    };
};

export const resetDocumentValue = (projectUid: string, documentUid: string) => {
    return {
        type: DOCUMENT_RESET,
        projectUid,
        documentUid
    };
};

export const saveFile = (): ((dispatch: any) => Promise<void>) => {
    return async () => {
        const state = store.getState() as RootState;
        const dock = state.ProjectEditorReducer.tabDock;
        const activeTab = dock.openDocuments[dock.tabIndex];
        const documentUid = activeTab.uid;
        const activeProjectUid = pathOr(
            "",
            ["ProjectsReducer", "activeProjectUid"],
            state
        );
        const project: IProject = pathOr(
            {} as IProject,
            ["ProjectsReducer", "projects", activeProjectUid],
            state
        );
        const document_ =
            project &&
            find(project.documents, (d) => d.documentUid === documentUid);
        if (project && document_) {
            try {
                updateDoc(
                    doc(
                        collection(doc(projects, project.projectUid), "files"),
                        document_.documentUid
                    ),
                    {
                        value: document_.currentValue,
                        lastModified: getFirebaseTimestamp()
                    }
                );

                updateProjectLastModified(project.projectUid);
            } catch {}
        }
    };
};

export const saveAllFiles = () => {
    return async () => {
        const state = store.getState() as RootState;
        const activeProjectUid = pathOr(
            "",
            ["ProjectsReducer", "activeProjectUid"],
            state
        );
        const project: IProject = pathOr(
            {} as IProject,
            ["ProjectsReducer", "projects", activeProjectUid],
            state
        );
        const documents =
            project &&
            _filter(
                Object.values(project.documents),
                (d) => d.isModifiedLocally
            );
        if (project && documents && !isEmpty(documents)) {
            const batch = writeBatch(database);
            documents.forEach((document_) => {
                batch.update(
                    doc(
                        collection(doc(projects, project.projectUid), "files"),
                        document_.documentUid
                    ),
                    {
                        value: document_.currentValue,
                        lastModified: getFirebaseTimestamp()
                    }
                );
            });
            batch.commit();
            updateProjectLastModified(project.projectUid);
        }
    };
};

export const saveAllAndClose = (dispatch: any, goTo: string) => {
    return saveAllFiles()().then(() => dispatch(push(goTo)), console.error);
};

// for unauthorized or offline playing
export const saveFileOffline = (
    csound: CsoundObj,
    activeProjectUid: string,
    document: IDocument,
    newValue: string
): void => {
    const pathPrefix = document.path || [];
    const absolutePath = concat(
        [`/${activeProjectUid}`],
        append(document.filename, pathPrefix)
    ).join("/");
    addDocumentToCsoundFS(
        activeProjectUid,
        csound,
        assoc("savedValue", newValue, document),
        absolutePath
    );
};

// for unauthorized or offline playing
export const saveAllOffline = (csound: CsoundObj): void => {
    const state = store.getState() as RootState;
    const activeProjectUid = pathOr(
        "",
        ["ProjectsReducer", "activeProjectUid"],
        state
    );
    const project: IProject | undefined = path(
        ["ProjectsReducer", "projects", activeProjectUid],
        state
    );
    if (project) {
        const documents: IDocument[] = Object.values(project.documents);
        forEach((document: IDocument) => {
            const pathPrefix = document.path || [];
            const absolutePath = concat(
                [`/${activeProjectUid}`],
                append(document.filename, pathPrefix)
            ).join("/");
            addDocumentToCsoundFS(
                activeProjectUid,
                csound,
                assoc("savedValue", document.currentValue, document),
                absolutePath
            );
        }, documents);
    }
};

export const deleteFile = (
    projectUid: string,
    documentUid: string
): ((dispatch: any, getState: () => RootState) => Promise<void>) => {
    return async (dispatch: any, getState) => {
        const state = getState() as RootState;
        const project: IProject = pathOr(
            {} as IProject,
            ["ProjectsReducer", "projects", projectUid],
            state
        );
        if (project) {
            const document_ = project.documents[documentUid];
            if (document_ && document_.type === "folder") {
                const allNestedFiles = filter(
                    (d: IDocument) => (d.path || []).includes(documentUid),
                    project.documents
                );
                const allFilesToDelete = append(
                    document_,
                    values(allNestedFiles)
                );
                dispatch(
                    openSimpleModal("delete-document-prompt", {
                        filename: document_.filename,
                        isFolder: true,
                        folderContents: allFilesToDelete,
                        documentUid,
                        projectUid
                    })
                );
            } else if (document_) {
                dispatch(
                    openSimpleModal("delete-document-prompt", {
                        filename: document_.filename,
                        isFolder: false,
                        folderContents: [],
                        documentUid,
                        projectUid
                    })
                );
            } else {
                console.error("No document found with id", projectUid);
            }
        } else {
            console.error("No project found with id", projectUid);
        }
    };
};

export const saveUpdatedDocument = (
    projectUid: string,
    document: IDocument
): Record<string, any> => ({
    type: DOCUMENT_SAVE,
    document,
    projectUid
});

export const updateDocumentValue = (
    value: string,
    projectUid: string,
    documentUid: string
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: DOCUMENT_UPDATE_VALUE,
            val: value,
            projectUid,
            documentUid
        });
    };
};

export const updateDocumentModifiedLocally = (
    isModified: boolean,
    projectUid: string,
    documentUid: string
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: DOCUMENT_UPDATE_MODIFIED_LOCALLY,
            isModified,
            documentUid,
            projectUid
        });
    };
};

export const newFolder = (projectUid: string) => {
    return openSimpleModal("new-folder-prompt", { projectUid });
};

export const newDocument = (projectUid: string, initFilename: string) => {
    return openSimpleModal("new-document-prompt", {
        isRenameAction: false,
        initFilename,
        projectUid
    });
};

export const addDocument = (projectUid: string) => {
    return openSimpleModal("add-document-prompt", { projectUid });
};

export const renameDocumentLocally = (
    documentUid: string,
    newFilename: string
): {
    type: typeof DOCUMENT_RENAME_LOCALLY;
    newFilename: string;
    documentUid: string;
} => {
    return {
        type: DOCUMENT_RENAME_LOCALLY,
        newFilename,
        documentUid
    };
};

export const removeDocumentLocally = (
    projectUid: string,
    documentUid: string
): Record<string, any> => {
    return {
        type: DOCUMENT_REMOVE_LOCALLY,
        projectUid,
        documentUid
    };
};

export const renameDocument = (
    projectUid: string,
    documentUid: string
): any => {
    const state = store.getState() as RootState;
    const project: IProject = pathOr(
        {} as IProject,
        ["ProjectsReducer", "projects", projectUid],
        state
    );
    if (!project) {
        console.error("Project", projectUid, "was not found!");
        return;
    }
    const currentFilename = pathOr(
        "",
        ["documents", documentUid, "filename"],
        project
    );
    return openSimpleModal("new-document-prompt", {
        isRenameAction: true,
        initFilename: currentFilename,
        projectUid,
        renameDocumentUid: documentUid
    });
};

const createExportPath = (
    folders: Record<string, IDocument>,
    document_: CsoundFile
): string => {
    if (!folders || pathOr([], ["path"], document_).length === 0) {
        return document_.filename;
    }
    const paths = document_.path.map((d) => folders[d].filename);
    return `${paths.join("/")}/${document_.filename}`;
};

export const exportProject = (): ((dispatch: any) => Promise<void>) => {
    return async () => {
        const state = store.getState() as RootState;
        const activeProjectUid = pathOr(
            "",
            ["ProjectsReducer", "activeProjectUid"],
            state
        );
        const project: IProject = pathOr(
            {} as IProject,
            ["ProjectsReducer", "projects", activeProjectUid],
            state
        );

        if (!isEmpty(project)) {
            const zip = new JSZip();
            const folder = zip.folder("project") as any;
            const documents = Object.values(project.documents);

            const folders: Record<string, IDocument> = documents
                .filter((d) => d.type === "folder")
                .reduce(
                    (m, f) => {
                        return { ...m, [f.documentUid]: f };
                    },
                    {} as Record<string, IDocument>
                );

            if (!folders) {
                console.error(`No folders found.`);
                return;
            }
            for (const document_ of documents) {
                if (document_.type === "bin") {
                    const path = `${project.userUid}/${project.projectUid}/${document_.documentUid}`;
                    const url = await getDownloadURL(
                        await storageReference(path)
                    );

                    const response = await fetch(url);
                    const blob = await response.arrayBuffer();
                    const exportPath = createExportPath(folders, document_);
                    if (exportPath && folder && folder.file) {
                        folder.file(exportPath, blob, { binary: true });
                    } else {
                        console.error(`whoops, no export path was created`);
                    }
                } else if (document_.type === "txt") {
                    const exportPath = createExportPath(folders, document_);
                    folder.file(exportPath, document_.savedValue);
                }
            }

            zip.generateAsync({ type: "blob" }).then((content) => {
                saveAs(content, "project.zip");
            });
        }
    };
};

export const markProjectPublic = (projectUid: string, isPublic: boolean) => {
    return async (dispatch: AppThunkDispatch, getState: () => RootState) => {
        const state = getState();
        const loggedInUserUid = selectLoggedInUid(state);
        if (!loggedInUserUid || !projectUid) {
            return;
        }
        await updateDoc(doc(projects, projectUid), { public: isPublic });
        dispatch({
            type: SET_PROJECT_PUBLIC,
            projectUid,
            isPublic
        });
        updateProjectLastModified(projectUid);
    };
};
