// const firebase = require("firebase");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const log = require("./logger.js")("new_user_callback");

// Delete an associated binary file when a project file entry is deleted 
const project_file_storage_delete = async binaryUrl => {
    log(
        "project_file_storate_delete",
        `Deleting associated binary file from storage: ${binaryUrl}`
    );

    return await admin
        .storage()
        .bucket('csound-ide.appspot.com')
        .file(binaryUrl)
        .delete();
};

exports.project_file_storage_delete_callback = 
functions
  .firestore
  .document("projects/{projectId}/files/{fileId}")
  .onDelete((async (snapshot, context) => {
     const params = context.params;
     const uid = snapshot.data().userUid;
     const filetype = snapshot.data().type;
     const binaryUrl = `${uid}/${params.projectId}/${params.fileId}`;

     log(
            "project_file_storage_delete_callback",
            `delete: ${filetype} ${binaryUrl}`
     )

    if(uid && filetype === "bin") {

        log(
            "project_file_storage_delete_callback",
            `Deleting binary file: ${binaryUrl}`
        );
        await project_file_storage_delete(binaryUrl);

    } 

        return true;
    }));
