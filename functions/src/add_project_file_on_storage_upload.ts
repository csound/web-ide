import admin from "firebase-admin";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { makeLogger } from "./logger.js";

admin.initializeApp(); // ensure this is done somewhere in your setup
const log = makeLogger("addProjectFileOnStorageUpload");
const newTimestamp = admin.firestore.FieldValue.serverTimestamp();

export const addProjectFileOnStorageUploadCallback = onObjectFinalized(
    async (event) => {
        const obj = event.data;

        if (obj.metadata) {
            const { userUid, projectUid, docUid, filename } = obj.metadata;

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
                        created: newTimestamp,
                        lastModified: newTimestamp
                    });
            }
        }

        return true;
    }
);
