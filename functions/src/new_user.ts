import { type UserRecord } from "firebase-admin/auth";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import * as functions from "firebase-functions/v1";
import { log } from "firebase-functions/logger";
import { ensureProfileUsername } from "./profile_username.js";

async function createProfileDocument(user: UserRecord) {
    log(
        `createProfileDocument: Adding: ${user.displayName}, uid: ${user.uid} to profiles`
    );

    const profileDoc = {
        displayName: user.displayName ?? "",
        bio: "",
        link1: "",
        link2: "",
        link3: "",
        photoUrl: user.photoURL ?? "",
        userUid: user.uid,
        userJoinDate: Timestamp.now()
    };

    return ensureProfileUsername(getFirestore(), user.uid, profileDoc);
}

export const newUserCallback = functions
    .runWith({ failurePolicy: true })
    .auth.user()
    .onCreate(async (user) => {
        console.log(
            `newUserCallback: Creating new user: ${user.displayName}, uid: ${user.uid}`
        );

        await createProfileDocument(user);

        return true;
    });
