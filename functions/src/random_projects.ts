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

export const randomProjects = onCall(
    { cors: true },
    async ({ data }: { data: { count: number } }) => {
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
    }
);
