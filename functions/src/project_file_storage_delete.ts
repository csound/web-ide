import admin from "firebase-admin";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { config } from "firebase-functions/v1";
import { log } from "firebase-functions/logger";

async function projectFileStorageDelete(binaryUrl: string): Promise<void> {
    log(
        `project_file_storage_delete: Deleting associated binary file from storage: ${binaryUrl}`
    );

    await admin
        .storage()
        .bucket(config().storagebucket.url)
        .file(binaryUrl)
        .delete();
}

export const projectFileStorageDeleteCallback = onDocumentDeleted(
    "projects/{projectId}/files/{fileId}",
    async ({ params: { projectId, fileId }, data }) => {
        const uid = data.get("userUid");
        const filetype = data.get("type");
        const binaryUrl = `${uid}/${projectId}/${fileId}`;

        log(`project_file_storage_delete_callback: ${filetype} ${binaryUrl}`);

        if (uid && filetype === "bin") {
            log(
                `project_file_storage_delete_callback: Deleting binary file: ${binaryUrl}`
            );
            await projectFileStorageDelete(binaryUrl);
        }

        return true;
    }
);
