import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { makeLogger } from "./logger.js";

const log = makeLogger("followersCounter");

export const followersCounter = functions.firestore
    .document("followers/{userUid}")
    .onWrite(async (change, context) => {
        const userUid = context.params.userUid;
        const followersCountRef = admin
            .firestore()
            .collection("followersCount")
            .doc(userUid);

        if (!change.before.exists) {
            // New followers doc created = 1 new follower
            await followersCountRef.set({ followersCount: 1 });
        } else if (change.before.exists && change.after.exists) {
            // Follower count changed
            const dataAfter = change.after.data();
            await followersCountRef.set({
                followersCount: Object.keys(dataAfter || {}).length
            });
        } else if (!change.after.exists) {
            // No followers left, do nothing
        }

        return;
    });
