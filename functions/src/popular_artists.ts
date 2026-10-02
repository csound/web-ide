import admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
    createReadCache,
    createRequestLimiter,
    publicCallableOptions
} from "./public_requests.js";

type PopularArtist = {
    userUid: string;
    totalStars: number;
    projectCount: number;
};

const countStars = (value: unknown): number => {
    if (!value || typeof value !== "object") {
        return 0;
    }
    return Object.keys(value as Record<string, unknown>).length;
};

const acceptRequest = createRequestLimiter();
const loadArtists = createReadCache(async () => {
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

    return Array.from(artists.values()).sort((a, b) => {
        if (b.totalStars !== a.totalStars) {
            return b.totalStars - a.totalStars;
        }
        if (b.projectCount !== a.projectCount) {
            return b.projectCount - a.projectCount;
        }
        return a.userUid.localeCompare(b.userUid);
    });
});

export const popularArtists = onCall<{ count?: number }>(
    publicCallableOptions,
    async ({ data }) => {
        const count = data?.count ?? 8;
        if (!Number.isInteger(count) || count < 1 || count > 50) {
            throw new HttpsError(
                "invalid-argument",
                "Choose between 1 and 50 artists."
            );
        }
        acceptRequest();
        return (await loadArtists()).slice(0, count);
    }
);
