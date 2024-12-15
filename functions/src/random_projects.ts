import admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { log } from "firebase-functions/logger";
import { shuffle } from "lodash-es";

let lastUpdate = Date.now();
let projects: any[] = [];

export const randomProjects = onCall<{ count: number }>(async ({ data }) => {
    if (projects.length === 0 || Date.now() - lastUpdate > 1000 * 60 * 5) {
        lastUpdate = Date.now();
        const db = admin.firestore();
        const projectsCollection = await db
            .collection("projects")
            .where("public", "==", true)
            .orderBy("created", "desc")
            .limit(100)
            .get();
        const nextProjects = projectsCollection.docs.map((doc) => ({
            ...doc.data(),
            projectUid: doc.id
        }));
        if (nextProjects.length > 0) {
            projects = nextProjects;
        }
        log("projectsLength: " + projects.length);
    }

    return shuffle(projects).slice(0, data.count);
});
