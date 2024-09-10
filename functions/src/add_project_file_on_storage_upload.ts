import admin from "firebase-admin";
import { storage } from "firebase-functions";
import { makeLogger } from "./logger.js";

const log = makeLogger("addProjectFileOnStorageUpload");

const newTimestamp = admin.firestore.FieldValue.serverTimestamp;

// Add a project file entry in Firestore when a binary file is uploaded
export const addProjectFileOnStorageUploadCallback = storage
    .object()
    .onFinalize(async (obj) => {
        const metadata = obj.metadata;

        if (metadata) {
            const { userUid, projectUid, docUid, filename } = metadata;

            if (userUid && projectUid && docUid && filename) {
                const collection = `/projects/${userUid}/${projectUid}/files`;
                log(
                    `addProjectFileOnStorageUploadCallback: Adding project file entry in Firestore: ${collection} ${docUid} ${filename}`
                );

                await admin
                    .firestore()
                    .collection("projects")
                    .doc(projectUid)
                    .collection("files")
                    .doc(docUid)
                    .set({
                        name: filename,
                        type: "bin",
                        userUid,
                        value: "",
                        created: newTimestamp(),
                        lastModified: newTimestamp()
                    });
            }
        }

        return true;
    });
