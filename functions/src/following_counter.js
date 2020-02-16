const admin = require("firebase-admin");
const functions = require("firebase-functions");
const log = require("./logger.js")("following_counter");

exports.following_counter = functions.firestore
    .document("following/{userUid}")
    .onWrite(async (change, context) => {
        const userUid = context.params.userUid;
        const followingCountRef = await admin
            .firestore()
            .collection("followingCount")
            .doc(userUid);
        if (!change.before.exists) {
            // First time following = 1 following
            await followingCountRef.set({ followingCount: 1 });
        } else if (change.before.exists && change.after.exists) {
            // Following count changed
            const dataAfter = change.after.data();
            await followingCountRef.set({
                followingCount: Object.keys(dataAfter || {}).length
            });
        } else if (!change.after.exists) {
            // Not following anyone anymore, do nothing
        }

        return;
    });
