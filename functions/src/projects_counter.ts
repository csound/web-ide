import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { log } from "firebase-functions/logger";

export const projectsCounter = onDocumentWritten(
    "projects/{projectUid}",
    async (event) => {
        const before = event.data.before;
        const after = event.data.after;

        // Document created
        if (!before.exists && after.exists) {
            log("projects_counter: new project created");
            const newProjectData = after.data();
            const isPublic = newProjectData?.public ?? undefined;
            const ownerUid = newProjectData?.userUid ?? undefined;

            if (!newProjectData || !ownerUid || ownerUid.length === 0) {
                log("INVALID PROJECT DETECTED");
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

            // Document updated
        } else if (before.exists && after.exists) {
            log("project modified");
            const dataBefore = before.data();
            const dataAfter = after.data();
            const isPublicBefore = dataBefore?.public ?? undefined;
            const isPublicAfter = dataAfter?.public ?? undefined;

            // If public status changed, adjust counts
            if (dataAfter && isPublicBefore !== isPublicAfter) {
                const ownerUid = dataAfter.userUid;
                const countRef = admin
                    .firestore()
                    .collection("projectsCount")
                    .doc(ownerUid);

                if (!isPublicBefore && isPublicAfter) {
                    // Was private, now public
                    await countRef.update({ public: FieldValue.increment(1) });
                } else if (isPublicBefore && !isPublicAfter) {
                    // Was public, now private
                    await countRef.update({ public: FieldValue.increment(-1) });
                }
            }

            // Document deleted
        } else if (before.exists && !after.exists) {
            log("projects_counter: project deleted");
            const oldProjectData = before.data();
            const isPublic = oldProjectData?.public ?? undefined;
            const ownerUid = oldProjectData?.userUid ?? undefined;

            if (!oldProjectData || !ownerUid || ownerUid.length === 0) {
                log("INVALID PROJECT DETECTED");
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
    }
);
