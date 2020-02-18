const admin = require("firebase-admin");
const functions = require("firebase-functions");
const log = require("./logger.js")("projects_counter");
const FieldValue = admin.firestore.FieldValue;

exports.projects_counter = functions.firestore
    .document("projects/{projectUid}")
    .onWrite(async (change, context) => {
        if (!change.before.exists) {
            // New project Created : add one to count
            log("projects_counter", "new project created");
            const newProjectData = change.after.data();
            const isPublic = newProjectData.public;
            const ownerUid = newProjectData.userUid;
            if (!ownerUid || ownerUid.length === 0) {
                console.error("INVALID PROJECT DETECTED: " + newProjectData.id);
                return;
            }
            const countRef = await admin
                .firestore()
                .collection("projectsCount")
                .doc(ownerUid);

            if (isPublic) {
                countRef.update({
                    all: FieldValue.increment(1),
                    public: FieldValue.increment(1)
                });
            } else {
                countRef.update({ all: FieldValue.increment(1) });
            }
        } else if (change.before.exists && change.after.exists) {
            log("projects_counter", "project modified");
            const dataBefore = change.before.data();
            const dataAfter = change.after.data();
            const isPublicBefore = dataBefore.public;
            const isPublicAfter = dataAfter.public;

            if (isPublicBefore !== isPublicAfter) {
                const ownerUid = dataAfter.userUid;
                const countRef = await admin
                    .firestore()
                    .collection("projectsCount")
                    .doc(ownerUid);

                if (!isPublicBefore) {
                    countRef.update({ public: FieldValue.increment(1) });
                } else {
                    countRef.update({ public: FieldValue.increment(-1) });
                }
            }
        } else if (!change.after.exists) {
            // Deleting project : subtract one from count
            const oldProjectData = change.before.data();
            const isPublic = oldProjectData.public;
            const ownerUid = oldProjectData.userUid;
            if (!ownerUid || ownerUid.length === 0) {
                console.error("INVALID PROJECT DETECTED: " + oldProjectData.id);
                return;
            }

            const countRef = await admin
                .firestore()
                .collection("projectsCount")
                .doc(ownerUid);

            if (isPublic) {
                countRef.update({
                    all: FieldValue.increment(-1),
                    public: FieldValue.increment(-1)
                });
            } else {
                countRef.update({ all: FieldValue.increment(-1) });
            }
        }

        return;
    });
