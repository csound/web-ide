import { IDocument, IDocumentsMap } from "./types";
import { ICsoundObj } from "@comp/Csound/types";
import { projects } from "@config/firestore";
import { addDocumentToEMFS } from "./utils";
import {
    addProjectDocuments,
    removeDocumentLocally,
    saveUpdatedDocument
} from "./actions";
import { tabClose } from "@comp/ProjectEditor/actions";
import {
    assoc,
    filter,
    forEach,
    map,
    isEmpty,
    pipe,
    prop,
    propEq,
    reduce,
    values
} from "ramda";

const docDataToDocumentMap = docData =>
    ({
        createdAt: docData["createdAt"] || docData["lastModified"], // migration fix
        currentValue: docData["value"],
        documentUid: docData["documentUid"],
        filename: docData["name"],
        isModifiedLocally: false,
        lastModified: docData["lastModified"],
        savedValue: docData["value"],
        type: docData["type"],
        userUid: docData["userUid"]
    } as IDocument);

const convertToDocumentsMap = docsToAdd =>
    (pipe as any)(
        map(prop("doc")),
        map((d: any) => assoc("documentUid", d.id, d.data())),
        reduce((acc: IDocumentsMap, docData: any) => {
            acc[docData["documentUid"]] = docDataToDocumentMap(docData);
            return acc;
        }, {})
    )(docsToAdd);

export const subscribeToProjectFilesChanges = (
    projectUid: string,
    dispatch: any,
    csound: ICsoundObj
) => {
    const unsubscribe: () => void = projects
        .doc(projectUid)
        .collection("files")
        .onSnapshot(async files => {
            const changedFiles = files.docChanges();
            const filesToAdd = filter(propEq("type", "added"), changedFiles);
            const filesToRemove = filter(
                propEq("type", "removed"),
                changedFiles
            );
            const filesToModify = filter(
                propEq("type", "modified"),
                changedFiles
            );

            if (!isEmpty(filesToAdd)) {
                const docs: IDocumentsMap = convertToDocumentsMap(filesToAdd);
                (forEach as any)(
                    addDocumentToEMFS(projectUid, csound),
                    values(docs)
                );
                dispatch(addProjectDocuments(projectUid, docs));
            }

            if (!isEmpty(filesToModify)) {
                const docsSnaps = map(prop("doc"), filesToModify);
                const docData = map(
                    d =>
                        docDataToDocumentMap(
                            assoc("documentUid", d.id, d.data())
                        ),
                    docsSnaps
                ) as IDocument[];

                // when using serverData, we get 2 responses,
                // since we always modify the lastModified timestamp,
                // it will be null the first time and immedietly not-null
                const docDataReady = docData.filter(d => !!d.lastModified);
                docDataReady.forEach(doc => {
                    dispatch(saveUpdatedDocument(projectUid, doc));
                    csound.unlinkFromFS(doc.filename);
                    addDocumentToEMFS(projectUid, csound, doc);
                });
            }
            if (!isEmpty(filesToRemove)) {
                const docsSnaps = map(prop("doc"), filesToRemove);
                const docsData = map(
                    d =>
                        docDataToDocumentMap(
                            assoc("documentUid", d.id, d.data())
                        ),
                    docsSnaps
                ) as IDocument[];
                const uids = map(prop("documentUid"), docsData);
                const names = map(prop("filename"), docsData);
                uids.forEach(uid => {
                    dispatch(tabClose(projectUid, uid, false));
                    dispatch(removeDocumentLocally(projectUid, uid));
                });
                names.forEach(name => csound.unlinkFromFS(name));
            }
        });
    return unsubscribe;
};

export const subscribeToProjectChanges = (
    projectUid: string,
    dispatch: any,
    csound: ICsoundObj
) => {
    const unsubscribeFileChanges = subscribeToProjectFilesChanges(
        projectUid,
        dispatch,
        csound
    );
    const unsubscribe = () => [unsubscribeFileChanges].forEach(u => u());
    return unsubscribe;
};
