import { WriteResult } from "@google-cloud/firestore";
import { Timestamp } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import functions from "firebase-functions/v1";
import { makeLogger } from "./logger.js";

admin.initializeApp();
const log = makeLogger("newUser");

async function createProfileDocument(
    user: admin.auth.UserRecord
): Promise<WriteResult> {
    log(
        `createProfileDocument: Adding: ${user.displayName}, uid: ${user.uid} to profiles`
    );

    const profileDoc = {
        displayName: user.displayName,
        bio: "",
        link1: "",
        link2: "",
        link3: "",
        photoUrl: user.photoURL,
        userUid: user.uid,
        userJoinDate: Timestamp.now(),
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
}

export const newUserCallback = functions.auth.user().onCreate(async (user) => {
    console.log(
        `newUserCallback: Creating new user: ${user.displayName}, uid: ${user.uid}`
    );

    try {
        await createProfileDocument(user);
    } catch (error) {
        console.error("Error creating profile document:", error);
    }

    return true;
});
