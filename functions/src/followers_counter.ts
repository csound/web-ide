import admin from "firebase-admin";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

export const followersCounter = onDocumentWritten(
    "followers/{userUid}",
    async (event) => {
        const before = event.data.before;
        const after = event.data.after;
        const userUid = event.params.userUid;

        const followersCountRef = admin
            .firestore()
            .collection("followersCount")
            .doc(userUid);

        // Document created
        if (!before.exists && after.exists) {
            // New followers doc created = 1 new follower
            await followersCountRef.set({ followersCount: 1 });
        }
        // Document updated
        else if (before.exists && after.exists) {
            const dataAfter = after.data();
            await followersCountRef.set({
                followersCount: Object.keys(dataAfter || {}).length
            });
        }
        // Document deleted
        else if (!after.exists) {
            // No followers left, do nothing (or you could remove the doc)
            // await followersCountRef.delete();
        }

        return;
    }
);
