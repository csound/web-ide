import { getAuth, type UserRecord } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as functions from "firebase-functions/v1";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { log } from "firebase-functions/logger";

const deleteUserDocument = async (user: UserRecord): Promise<void> => {
    log(`deleteUserDocument: Deleting user document for: ${user.displayName}`);
    try {
        await getFirestore().collection("users").doc(user.uid).delete();
    } catch (error) {
        log(
            "error: " + JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
    }
};

const deleteProfileDocument = async (user: UserRecord): Promise<void> => {
    log(`deleteProfileDocument: Deleting profile for: ${user.displayName}`);
    try {
        await getFirestore().collection("profiles").doc(user.uid).delete();
    } catch (error) {
        log(
            "error: " + JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
    }
};

const deleteUsernameDocument = async (user: UserRecord): Promise<void> => {
    log(`deleteUsernameDocument: Deleting username of: ${user.displayName}`);
    try {
        const querySnapshot = await getFirestore()
            .collection("usernames")
            .where("userUid", "==", user.uid)
            .get();
        for (const doc of querySnapshot.docs) {
            await getFirestore().doc(doc.ref.path).delete();
        }
    } catch (error) {
        log(
            "error: " + JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
    }
};

const deleteUserProjects = async (user: UserRecord): Promise<void> => {
    log(`deleteProjects: Deleting projects created by: ${user.displayName}`);
    const batch = getFirestore().batch();
    try {
        const allProjectsRef = await getFirestore()
            .collection("projects")
            .where("userUid", "==", user.uid)
            .get();

        await Promise.all(
            allProjectsRef.docs.map(async (doc) => {
                const projectRef = getFirestore().doc(doc.ref.path);
                const projectSubcolls = await projectRef.listCollections();

                for (const subcoll of projectSubcolls) {
                    const subcollDocs = await subcoll.get();
                    subcollDocs.forEach((subcollDoc) => {
                        batch.delete(subcollDoc.ref);
                    });
                }

                const projectLastModifiedRef = getFirestore()
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

const deleteProjectsCount = async (user: UserRecord): Promise<void> => {
    log(
        `deleteProjectsCount: Deleting projectsCount for: ${user.displayName} under ${user.uid}`
    );
    try {
        await getFirestore().collection("projectsCount").doc(user.uid).delete();
    } catch (error) {
        log(
            "error: " + JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
    }
};

const cleanupDeletedUserData = async (user: UserRecord): Promise<void> => {
    await deleteUserProjects(user);
    await deleteProfileDocument(user);
    await deleteUserDocument(user);
    await deleteUsernameDocument(user);
    await deleteProjectsCount(user);
};

export const deleteAccount = onCall({ cors: true }, async (request) => {
    const auth = request.auth;

    if (!auth?.uid) {
        throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const signedInAt = auth.token?.auth_time;
    const now = Date.now() / 1000;
    if (
        typeof signedInAt !== "number" ||
        !Number.isFinite(signedInAt) ||
        signedInAt < now - 5 * 60 ||
        signedInAt > now + 60
    ) {
        throw new HttpsError(
            "failed-precondition",
            "Sign in again before deleting your account.",
            { reason: "requires-recent-login" }
        );
    }

    try {
        const user = await getAuth().getUser(auth.uid);
        await cleanupDeletedUserData(user);
        await getAuth().deleteUser(auth.uid);

        return { success: true };
    } catch (error) {
        log(
            "deleteAccount error: " +
                JSON.stringify(error, Object.getOwnPropertyNames(error || {}))
        );

        throw new HttpsError(
            "internal",
            "Failed to delete account and associated data."
        );
    }
});

export const deleteUserCallback = functions.auth
    .user()
    .onDelete(async (user) => {
        log(
            `deleteUserCallback: Removing user: ${user.displayName}, uid: ${user.uid}`
        );
        await cleanupDeletedUserData(user);

        return true;
    });
