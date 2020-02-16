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

    const allProjectsRef = await admin
        .firestore()
        .collection(`projects`)
        .where("userUid", "==", user.uid)
        .get();

    await allProjectsRef.forEach(async projectSnapshot => {
        // first delete subcollections
        const projectRef = admin.firestore().doc(doc.ref.path);
        const projectSubcolls = await docRef.listCollections();
        await projectSubcolls.forEach(async subcoll => {
            await subcoll.forEach(async subcollDoc => {
                batch.delete(subcollDoc);
            });
            batch.delete(subcoll);
        });
        const projectLastModifiedRef = admin
            .firestore()
            .collection(`projectLastModified`)
            .doc(projectRef.id);
        batch.delete(projectLastModifiedRef);
        batch.delete(projectRef);
    });
    batch.commit();
    return;
};

const deleteProjectsCount = async user => {
    log(
        "deleteProjectsCount",
        `Deleting prjectsCount for: ` + `${user.displayName} under ${user.id}`
    );
    return await admin
        .firestore()
        .collection(`projectsCount`)
        .doc(user.uid)
        .delete()
        .then(() => {})
        .catch(err => {
            log("error", err);
            return;
        });
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
    await deleteProjectsCount(user);
    return true;
});
