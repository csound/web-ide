import admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
    createReadCache,
    createRequestLimiter,
    publicCallableOptions
} from "./public_requests.js";
import {
    addProjectCardDetails,
    readPublicProjectSummaries
} from "./public_project_summaries.js";

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

const acceptRequest = createRequestLimiter();
const loadProjectIds = createReadCache(async () => {
    const snapshot = await admin
        .firestore()
        .collection("projects")
        .where("public", "==", true)
        .orderBy("created", "desc")
        .limit(100)
        .get();
    return snapshot.docs.map((doc) => doc.id);
});

export const randomProjects = onCall(
    publicCallableOptions,
    async ({ data }: { data: { count: number } }) => {
        const count = data?.count ?? 8;
        if (!Number.isInteger(count) || count < 1 || count > 50) {
            throw new HttpsError(
                "invalid-argument",
                "Choose between 1 and 50 projects."
            );
        }
        acceptRequest();
        const ids = shuffle(await loadProjectIds());
        const projects: Awaited<ReturnType<typeof readPublicProjectSummaries>> =
            [];
        for (
            let offset = 0;
            offset < ids.length && projects.length < count;
            offset += count
        ) {
            projects.push(
                ...(await readPublicProjectSummaries(
                    ids.slice(offset, offset + count)
                ))
            );
        }
        return addProjectCardDetails(
            projects.slice(0, count),
            (project) => project.projectUid
        );
    }
);
