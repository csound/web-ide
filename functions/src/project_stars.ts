import type { Firestore } from "firebase-admin/firestore";

/** Re-read both records so retries, old events, and backfills cannot set stale counts. */
export async function syncProjectStarCount(
    db: Firestore,
    projectUid: string,
    apply = true
) {
    const projectRef = db.collection("projects").doc(projectUid);
    const starsRef = db.collection("stars").doc(projectUid);
    return db.runTransaction(async (transaction) => {
        const [project, stars] = await transaction.getAll(projectRef, starsRef);
        if (!project.exists) return { projectUid, changed: false };
        const starCount = Object.keys(stars.data() ?? {}).length;
        const changed = project.data()?.starCount !== starCount;
        if (changed && apply) transaction.update(projectRef, { starCount });
        return { projectUid, starCount, changed };
    });
}
