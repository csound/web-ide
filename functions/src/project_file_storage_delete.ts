import admin from "firebase-admin";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { log } from "firebase-functions/logger";
import "dotenv/config";

async function projectFileStorageDelete(binaryUrl: string): Promise<void> {
    log(
        `project_file_storage_delete: Deleting associated binary file from storage: ${binaryUrl}`
    );

    await admin
        .storage()
        .bucket(process.env.STORAGE_BUCKET_URL!)
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
