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

const deleteUsernameDocument = async user => {
    log(
        "deleteUsernameDocument",
        `Deleting the username of: ${user.displayName}`
    );
    await admin
        .firestore()
        .collection(`usernames`)
        .where("userUid", "==", user.uid)
        .get()
        .then(querySnapshot => {
            querySnapshot.forEach(doc => {
                admin
                    .firestore()
                    .doc(doc.ref.path)
                    .delete()
                    .then(() => {});
            });
        });
    return;
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
                const docRef = admin.firestore().doc(doc.ref.path);
                docRef.listCollections().then(collections => {
                    collections.forEach(coll => {
                        coll.listDocuments().then(subDocs => {
                            subDocs.forEach(subDoc => {
                                batch.delete(subDoc);
                            });
                            batch.delete(docRef);
                            batch.commit();
                        });
                    });
                });
            });
        });
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
    await deleteUsernameDocument(user);
    return true;
});
