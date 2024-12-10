import * as admin from "firebase-admin";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { makeLogger } from "./logger.js";

admin.initializeApp();
const log = makeLogger("followersCounter");

export const followingCounter = onDocumentWritten(
    "following/{userUid}",
    async (event) => {
        const before = event.data.before;
        const after = event.data.after;
        const userUid = event.params.userUid;

        const followingCountRef = admin
            .firestore()
            .collection("followingCount")
            .doc(userUid);

        if (!before.exists && after.exists) {
            // First time following = 1 following
            await followingCountRef.set({ followingCount: 1 });
        } else if (before.exists && after.exists) {
            // Following count changed
            const dataAfter = after.data();
            await followingCountRef.set({
                followingCount: Object.keys(dataAfter || {}).length
            });
        } else if (!after.exists) {
            // No longer following anyone
            // You can leave it as is, or optionally remove the doc
            // await followingCountRef.delete();
        }

        return;
    }
);
