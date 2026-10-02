import admin from "firebase-admin";

/** Expose only the fields used by public project cards. */
export function publicProjectSummary(
    id: string,
    project: FirebaseFirestore.DocumentData
) {
    return {
        projectUid: id,
        userUid: project.userUid || "",
        name: project.name || "Untitled project",
        description: project.description || "",
        created: project.created ?? null,
        public: true,
        iconName: project.iconName || "fadwaveform",
        iconBackgroundColor: project.iconBackgroundColor || "#212226",
        iconForegroundColor: project.iconForegroundColor || "#f3f4f6",
        starCount:
            typeof project.starCount === "number"
                ? project.starCount
                : project.stars || 0
    };
}

/** Check current visibility, including every match used in a search count. */
export async function readPublicProjectSummaries(ids: string[]) {
    if (!ids.length) return [];
    const db = admin.firestore();
    const projects: ReturnType<typeof publicProjectSummary>[] = [];
    for (let index = 0; index < ids.length; index += 50) {
        const snapshots = await db.getAll(
            ...ids
                .slice(index, index + 50)
                .map((id) => db.collection("projects").doc(id))
        );
        for (const snapshot of snapshots) {
            const project = snapshot.data();
            if (snapshot.exists && project?.public === true) {
                projects.push(publicProjectSummary(snapshot.id, project));
            }
        }
    }
    return projects;
}
