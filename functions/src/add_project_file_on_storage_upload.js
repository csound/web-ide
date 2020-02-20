// const firebase = require("firebase");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const log = require("./logger.js")("new_user_callback");
const newTimestamp = admin.firestore.FieldValue.serverTimestamp;

// Add a project file entry in Firestore when binary file is uploaded
exports.add_project_file_on_storage_upload_callback = functions.storage
    .object()
    .onFinalize(async (obj, context) => {
        if (obj.metadata) {
            const { userUid, projectUid, docUid, filename } = obj.metadata;

            if (userUid && projectUid && docUid && filename) {
                const collection = `/projects/${userUid}/${projectUid}/files`;
                log(
                    "add_project_file_on_storage_upload_callback",
                    `adding project file entry in firestore: ${collection} ${docUid} ${filename}`
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
        //const {filename} = obj.metadata;
        return true;
    });
