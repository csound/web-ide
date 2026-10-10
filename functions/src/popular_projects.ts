import { FieldPath, getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import {
    createRequestLimiter,
    publicCallableOptions
} from "./public_requests.js";
import {
    addProjectCardDetails,
    publicProjectSummary
} from "./public_project_summaries.js";

const acceptRequest = createRequestLimiter();

/** Read only the requested public projects, ordered by maintained star totals. */
export const popularProjects = onCall<{ count?: number }>(
    publicCallableOptions,
    async ({ data }) => {
        acceptRequest();
        const count = data?.count;
        const requestedCount =
            typeof count === "number" && Number.isFinite(count)
                ? Math.max(1, Math.min(50, Math.floor(count)))
                : 8;
        const db = getFirestore();
        const projects = await db
            .collection("projects")
            .where("public", "==", true)
            .where("starCount", ">", 0)
            .orderBy("starCount", "desc")
            .orderBy(FieldPath.documentId(), "asc")
            .limit(requestedCount)
            .get();

        return addProjectCardDetails(
            projects.docs.map((doc) =>
                publicProjectSummary(doc.id, doc.data())
            ),
            (project) => project.projectUid
        );
    }
);
