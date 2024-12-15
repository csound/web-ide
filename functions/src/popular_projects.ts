import admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { log } from "firebase-functions/logger";
import { shuffle } from "lodash-es";

let lastUpdate = Date.now();
let projects: any[] = [];

export const popularProjects = onCall<{ count: number }>(async ({ data }) => {
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
});
