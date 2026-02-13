import admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";

type PopularArtist = {
    userUid: string;
    totalStars: number;
    projectCount: number;
};

let lastUpdate = 0;
let cachedArtists: PopularArtist[] = [];
const CACHE_TTL = 1000 * 60 * 5;

const countStars = (value: unknown): number => {
    if (!value || typeof value !== "object") {
        return 0;
    }
    return Object.keys(value as Record<string, unknown>).length;
};

export const popularArtists = onCall<{ count: number }>(async ({ data }) => {
    const requestedCount = Math.max(1, Math.min(50, data?.count || 8));

    if (
        cachedArtists.length === 0 ||
        Date.now() - lastUpdate > CACHE_TTL
    ) {
        const db = admin.firestore();

        const [projectsSnapshot, starsSnapshot] = await Promise.all([
            db.collection("projects").where("public", "==", true).get(),
            db.collection("stars").get()
        ]);

        const starsByProjectUid = new Map<string, number>();
        starsSnapshot.forEach((doc) => {
            starsByProjectUid.set(doc.id, countStars(doc.data()));
        });

        const artists = new Map<string, PopularArtist>();
        projectsSnapshot.forEach((doc) => {
            const project = doc.data();
            const userUid = project.userUid as string | undefined;
            if (!userUid) {
                return;
            }

            const starCount =
                starsByProjectUid.get(doc.id) ||
                (typeof project.stars === "number" ? project.stars : 0);

            const previous = artists.get(userUid) || {
                userUid,
                totalStars: 0,
                projectCount: 0
            };

            artists.set(userUid, {
                userUid,
                totalStars: previous.totalStars + starCount,
                projectCount: previous.projectCount + 1
            });
        });

        cachedArtists = Array.from(artists.values()).sort((a, b) => {
            if (b.totalStars !== a.totalStars) {
                return b.totalStars - a.totalStars;
            }
            if (b.projectCount !== a.projectCount) {
                return b.projectCount - a.projectCount;
            }
            return a.userUid.localeCompare(b.userUid);
        });

        lastUpdate = Date.now();
    }

    return cachedArtists.slice(0, requestedCount);
});
