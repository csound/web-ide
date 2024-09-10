import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { makeLogger } from "./logger.js";

const log = makeLogger("projectFileStorageDelete");

// Delete an associated binary file when a project file entry is deleted
const projectFileStorageDelete = async (binaryUrl: string): Promise<void> => {
    log(
        `project_file_storage_delete: Deleting associated binary file from storage: ${binaryUrl}`
    );

    await admin
        .storage()
        .bucket(functions.config().storagebucket.url)
        .file(binaryUrl)
        .delete();
};

export const projectFileStorageDeleteCallback = functions.firestore
    .document("projects/{projectId}/files/{fileId}")
    .onDelete(async (snapshot, context) => {
        const { projectId, fileId } = context.params;
        const uid = snapshot.data().userUid;
        const filetype = snapshot.data().type;
        const binaryUrl = `${uid}/${projectId}/${fileId}`;

        log(`project_file_storage_delete_callback: ${filetype} ${binaryUrl}`);

        if (uid && filetype === "bin") {
            log(
                `project_file_storage_delete_callback: Deleting binary file: ${binaryUrl}`
            );
            await projectFileStorageDelete(binaryUrl);
        }

        return true;
    });
