import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { makeLogger } from "./logger.js";

const log = makeLogger("projectsCounter");
const FieldValue = admin.firestore.FieldValue;

export const projectsCounter = functions.firestore
    .document("projects/{projectUid}")
    .onWrite(async (change, context) => {
        if (!change.before.exists) {
            // New project created: add one to count
            log("projects_counter: new project created");
            const newProjectData = change.after.data();
            const isPublic = newProjectData?.public ?? undefined;
            const ownerUid = newProjectData?.userUid ?? undefined;

            if (!newProjectData || !ownerUid || ownerUid.length === 0) {
                log("INVALID PROJECT DETECTED: " + newProjectData!.id);
                return;
            }

            const countRef = admin
                .firestore()
                .collection("projectsCount")
                .doc(ownerUid);

            if (isPublic) {
                await countRef.update({
                    all: FieldValue.increment(1),
                    public: FieldValue.increment(1)
                });
            } else {
                await countRef.update({ all: FieldValue.increment(1) });
            }
        } else if (change.before.exists && change.after.exists) {
            // Project modified
            log("project modified");
            const dataBefore = change.before.data();
            const dataAfter = change.after.data();
            const isPublicBefore = dataBefore?.public ?? undefined;
            const isPublicAfter = dataAfter?.public ?? undefined;

            if (dataAfter && isPublicBefore !== isPublicAfter) {
                const ownerUid = dataAfter.userUid;
                const countRef = admin
                    .firestore()
                    .collection("projectsCount")
                    .doc(ownerUid);

                if (!isPublicBefore) {
                    await countRef.update({ public: FieldValue.increment(1) });
                } else {
                    await countRef.update({ public: FieldValue.increment(-1) });
                }
            }
        } else if (!change.after.exists) {
            // Deleting project: subtract one from count
            log("projects_counter: project");
            const oldProjectData = change.before.data();
            const isPublic = oldProjectData?.public ?? undefined;
            const ownerUid = oldProjectData?.userUid ?? undefined;

            if (!oldProjectData || !ownerUid || ownerUid.length === 0) {
                log("INVALID PROJECT DETECTED: " + (oldProjectData || {}).id);
                return;
            }

            const countRef = admin
                .firestore()
                .collection("projectsCount")
                .doc(ownerUid);

            if (isPublic) {
                await countRef.update({
                    all: FieldValue.increment(-1),
                    public: FieldValue.increment(-1)
                });
            } else {
                await countRef.update({ all: FieldValue.increment(-1) });
            }
        }

        return;
    });
