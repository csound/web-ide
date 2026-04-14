import admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { log } from "firebase-functions/logger";

const shuffle = <T>(items: T[]): T[] => {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [
            shuffled[swapIndex],
            shuffled[index]
        ];
    }

    return shuffled;
};

let lastUpdate = Date.now();
let projects: any[] = [];

export const popularProjects = onCall(
    { cors: true },
    async ({ data }: { data: { count: number } }) => {
        if (projects.length === 0 || Date.now() - lastUpdate > 1000 * 60 * 5) {
            lastUpdate = Date.now();
            const db = admin.firestore();
            const randomStars = await db.collection("stars").limit(200).get();
            // log("randomStarsLength: " + randomStars.docs.length);
            const projectUids = randomStars.docs.map((doc) => doc.id);
            // log("projectUids: " + JSON.stringify(projectUids, null, 2));
            // log("projectsLength: " + projects.length);
            projects = projectUids;
        }

        return shuffle(projects).slice(0, data.count);
    }
);
