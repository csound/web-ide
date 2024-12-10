import * as admin from "firebase-admin";
import functions from "firebase-functions/v1";
import { makeLogger } from "./logger.js";

const log = makeLogger("deleteUser");

admin.initializeApp();

const deleteUserDocument = async (
    user: admin.auth.UserRecord
): Promise<void> => {
    log(`deleteUserDocument: Deleting user document for: ${user.displayName}`);
    try {
        await admin.firestore().collection("users").doc(user.uid).delete();
    } catch (error) {
        log(
            "error: " + JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
    }
};

const deleteProfileDocument = async (
    user: admin.auth.UserRecord
): Promise<void> => {
    log(`deleteProfileDocument: Deleting profile for: ${user.displayName}`);
    try {
        await admin.firestore().collection("profiles").doc(user.uid).delete();
    } catch (error) {
        log(
            "error: " + JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
    }
};

const deleteUsernameDocument = async (
    user: admin.auth.UserRecord
): Promise<void> => {
    log(`deleteUsernameDocument: Deleting username of: ${user.displayName}`);
    try {
        const querySnapshot = await admin
            .firestore()
            .collection("usernames")
            .where("userUid", "==", user.uid)
            .get();
        for (const doc of querySnapshot.docs) {
            await admin.firestore().doc(doc.ref.path).delete();
        }
    } catch (error) {
        log(
            "error: " + JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
    }
};

const deleteUserProjects = async (
    user: admin.auth.UserRecord
): Promise<void> => {
    log(`deleteProjects: Deleting projects created by: ${user.displayName}`);
    const batch = admin.firestore().batch();
    try {
        const allProjectsRef = await admin
            .firestore()
            .collection("projects")
            .where("userUid", "==", user.uid)
            .get();

        await Promise.all(
            allProjectsRef.docs.map(async (doc) => {
                const projectRef = admin.firestore().doc(doc.ref.path);
                const projectSubcolls = await projectRef.listCollections();

                for (const subcoll of projectSubcolls) {
                    const subcollDocs = await subcoll.get();
                    subcollDocs.forEach((subcollDoc) => {
                        batch.delete(subcollDoc.ref);
                    });
                }

                const projectLastModifiedRef = admin
                    .firestore()
                    .collection("projectLastModified")
                    .doc(projectRef.id);
                batch.delete(projectLastModifiedRef);
                batch.delete(projectRef);
            })
        );

        await batch.commit();
    } catch (error) {
        log(
            "error: " + JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
    }
};

const deleteProjectsCount = async (
    user: admin.auth.UserRecord
): Promise<void> => {
    log(
        `deleteProjectsCount: Deleting projectsCount for: ${user.displayName} under ${user.uid}`
    );
    try {
        await admin
            .firestore()
            .collection("projectsCount")
            .doc(user.uid)
            .delete();
    } catch (error) {
        log(
            "error: " + JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
    }
};

export const deleteUserCallback = functions.auth
    .user()
    .onDelete(async (user) => {
        log(
            `deleteUserCallback: Removing user: ${user.displayName}, uid: ${user.uid}`
        );
        await deleteUserProjects(user);
        await deleteProfileDocument(user);
        await deleteUserDocument(user);
        await deleteUsernameDocument(user);
        await deleteProjectsCount(user);

        return true;
    });
