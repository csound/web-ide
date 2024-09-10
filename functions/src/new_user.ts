import { WriteResult } from "@google-cloud/firestore";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { makeLogger } from "./logger.js";

const log = makeLogger("newUser");
const newTimestamp = admin.firestore.FieldValue.serverTimestamp;

// For every new user, create a queryable Firestore profile document
const createProfileDocument = async (
    user: admin.auth.UserRecord
): Promise<WriteResult> => {
    log(
        `createProfileDocument: Adding: ${user.displayName}, with uid ${user.uid} to profiles`
    );

    const profileDoc = {
        displayName: user.displayName,
        bio: "",
        link1: "",
        link2: "",
        link3: "",
        photoUrl: user.photoURL,
        userUid: user.uid,
        userJoinDate: newTimestamp(),
        username: ""
    };

    // Initialize projectsCount collection
    await admin
        .firestore()
        .collection("projectsCount")
        .doc(user.uid)
        .set({ all: 0, public: 0 });

    // Add profile document to Firestore
    return admin
        .firestore()
        .collection("profiles")
        .doc(user.uid)
        .set(profileDoc);
};

export const newUserCallback = functions.auth.user().onCreate(async (user) => {
    log(
        `newUserCallback: Creating new user: ${user.displayName}, with uid ${user.uid}`
    );
    try {
        await createProfileDocument(user);
    } catch (error) {
        log(
            "error: " + JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
    }

    return true;
});
