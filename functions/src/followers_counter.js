const admin = require("firebase-admin");
const functions = require("firebase-functions");
const log = require("./logger.js")("followers_counter");

exports.followers_counter = functions.firestore
    .document("followers/{userUid}")
    .onWrite(async (change, context) => {
        const userUid = context.params.userUid;
        const followersCountRef = await admin
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
            // No follwers left, do nothing
        }

        return;
    });
