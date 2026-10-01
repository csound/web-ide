import admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";

/** Rank public projects by their current star records, with stable ties. */
export const popularProjects = onCall<{ count?: number }>(
    { cors: true },
    async ({ data }) => {
        const count = data?.count;
        const requestedCount =
            typeof count === "number" && Number.isFinite(count)
                ? Math.max(1, Math.min(50, Math.floor(count)))
                : 8;
        const db = admin.firestore();
        const [projects, stars] = await Promise.all([
            db.collection("projects").where("public", "==", true).get(),
            db.collection("stars").get()
        ]);
        const starsByProject = new Map(
            stars.docs.map((doc) => [doc.id, Object.keys(doc.data()).length])
        );

        return projects.docs
            .map((doc) => {
                const project = doc.data();
                return {
                    projectUid: doc.id,
                    userUid: project.userUid || "",
                    name: project.name || "Untitled project",
                    description: project.description || "",
                    created: project.created ?? null,
                    public: true,
                    iconName: project.iconName || "fadwaveform",
                    iconBackgroundColor:
                        project.iconBackgroundColor || "#212226",
                    iconForegroundColor:
                        project.iconForegroundColor || "#f3f4f6",
                    starCount: starsByProject.get(doc.id) ?? 0
                };
            })
            .filter((project) => project.starCount > 0)
            .sort(
                (a, b) =>
                    b.starCount - a.starCount ||
                    a.projectUid.localeCompare(b.projectUid)
            )
            .slice(0, requestedCount);
    }
);
