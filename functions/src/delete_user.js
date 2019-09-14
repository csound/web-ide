const admin = require("firebase-admin");
const client = require("firebase-tools");
const functions = require("firebase-functions");
const log = require("./logger.js")("new_user_callback");

const deleteUserDocument = async user => {
    log(
        "deleteUserDocument",
        `Deleting user document for: ${user.displayName}`
    );
    return await admin
        .firestore()
        .collection(`users`)
        .doc(user.uid)
        .delete()
        .then(() => {})
        .catch(err => {
            log("error", err);
            return;
        });
};

const deleteProfileDocument = async user => {
    log("deleteProfileDocument", `Deleting profile for: ${user.displayName}`);
    return await admin
        .firestore()
        .collection(`profiles`)
        .doc(user.uid)
        .delete()
        .then(() => {})
        .catch(err => {
            log("error", err);
            return;
        });
};

const deleteUserProjects = async user => {
    log("deleteProjects", `Deleting projects created by: ${user.displayName}`);
    // First delete the subcollections
    const batch = admin.firestore().batch();

    await admin
        .firestore()
        .collection(`projects`)
        .where("userUid", "==", user.uid)
        .get()
        .then(querySnapshot => {
            querySnapshot.forEach(doc => {
                // first delete subcollections
                log(
                    "debug",
                    `Read!: doc.ref.path ${doc.ref.path} doc.ref ${doc.ref}`
                );
                admin
                    .firestore()
                    .doc(doc.ref.path)
                    .listCollections()
                    .then(collections => {
                        log("debug", `Read!: collections ${collections}`);

                        collections.forEach(coll => {
                            coll.listDocuments().then(subDocs =>
                                subDocs.forEach(subDoc => {
                                    log(
                                        "debug",
                                        `Read!: batchDelete this -> ${subDoc}`
                                    );
                                    batch.delete(subDoc);
                                })
                            );
                        });
                    });
                batch.delete(doc.ref);
            });
        });

    batch.commit();
    return;
};

exports.delete_user_callback = functions.auth.user().onDelete(async user => {
    log(
        "delete_user_callback",
        `Removing user: ${user.displayName}, with uid ${user.uid}`
    );
    await deleteUserProjects(user);
    await deleteProfileDocument(user);
    await deleteUserDocument(user);
    return true;
});
