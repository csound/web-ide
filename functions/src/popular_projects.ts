import admin from "firebase-admin";
import { FieldPath } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";

/** Read only the requested public projects, ordered by maintained star totals. */
export const popularProjects = onCall<{ count?: number }>(
    { cors: true },
    async ({ data }) => {
        const count = data?.count;
        const requestedCount =
            typeof count === "number" && Number.isFinite(count)
                ? Math.max(1, Math.min(50, Math.floor(count)))
                : 8;
        const db = admin.firestore();
        const projects = await db
            .collection("projects")
            .where("public", "==", true)
            .where("starCount", ">", 0)
            .orderBy("starCount", "desc")
            .orderBy(FieldPath.documentId(), "asc")
            .limit(requestedCount)
            .get();

        return projects.docs.map((doc) => {
            const project = doc.data();
            return {
                projectUid: doc.id,
                userUid: project.userUid || "",
                name: project.name || "Untitled project",
                description: project.description || "",
                created: project.created ?? null,
                public: true,
                iconName: project.iconName || "fadwaveform",
                iconBackgroundColor: project.iconBackgroundColor || "#212226",
                iconForegroundColor: project.iconForegroundColor || "#f3f4f6",
                starCount: project.starCount
            };
        });
    }
);
