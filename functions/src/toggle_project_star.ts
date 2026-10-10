import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

/** Commit the star, profile list, and ranking count together. */
export const toggleProjectStar = onCall<{ projectUid: string }>(
    { cors: true },
    async ({ data, auth }) => {
        if (!auth?.uid)
            throw new HttpsError(
                "unauthenticated",
                "Sign in to star a project."
            );
        const projectUid = data?.projectUid;
        if (
            typeof projectUid !== "string" ||
            !projectUid ||
            projectUid.includes("/") ||
            projectUid === "." ||
            projectUid === ".." ||
            Buffer.byteLength(projectUid) > 1500
        )
            throw new HttpsError("invalid-argument", "Choose a project.");

        const db = getFirestore();
        const projectRef = db.collection("projects").doc(projectUid);
        const starsRef = db.collection("stars").doc(projectUid);
        const profileStarsRef = db.collection("profileStars").doc(auth.uid);
        return db.runTransaction(async (transaction) => {
            const [project, stars] = await transaction.getAll(
                projectRef,
                starsRef
            );
            if (!project.exists)
                throw new HttpsError(
                    "not-found",
                    "This project no longer exists."
                );
            const currentStars = stars.data() ?? {};
            const starred = !Object.hasOwn(currentStars, auth.uid);
            if (
                starred &&
                project.data()?.public !== true &&
                project.data()?.userUid !== auth.uid
            )
                throw new HttpsError(
                    "permission-denied",
                    "This project is private."
                );

            const value = starred
                ? FieldValue.serverTimestamp()
                : FieldValue.delete();
            const starCount =
                Object.keys(currentStars).length + (starred ? 1 : -1);
            transaction.set(starsRef, { [auth.uid]: value }, { merge: true });
            transaction.set(
                profileStarsRef,
                { [projectUid]: value },
                { merge: true }
            );
            transaction.update(projectRef, { starCount });
            return { starred, starCount };
        });
    }
);
