import admin from "firebase-admin";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { log } from "firebase-functions/logger";

async function projectFileStorageDelete(binaryUrl: string): Promise<void> {
    log(
        `project_file_storage_delete: Deleting associated binary file from storage: ${binaryUrl}`
    );

    const configuredBucket = process.env.STORAGE_BUCKET_URL?.trim();
    const bucket = configuredBucket
        ? admin.storage().bucket(configuredBucket)
        : admin.storage().bucket();

    if (!configuredBucket) {
        log(
            "project_file_storage_delete: STORAGE_BUCKET_URL not set, using default bucket from Firebase app config"
        );
    }

    await bucket.file(binaryUrl).delete();
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
