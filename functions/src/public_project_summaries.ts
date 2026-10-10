import { getFirestore } from "firebase-admin/firestore";

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
        ...(typeof project.forkedFrom === "string"
            ? {
                  forkedFrom: project.forkedFrom,
                  forkedAt: project.forkedAt ?? null
              }
            : {}),
        iconName: project.iconName || "fadwaveform",
        iconBackgroundColor: project.iconBackgroundColor || "#212226",
        iconForegroundColor: project.iconForegroundColor || "#f3f4f6",
        starCount:
            typeof project.starCount === "number" &&
            Number.isFinite(project.starCount)
                ? project.starCount
                : typeof project.stars === "number" &&
                    Number.isFinite(project.stars)
                  ? project.stars
                  : 0
    };
}

/** Check current visibility, including every match used in a search count. */
export async function readPublicProjectSummaries(ids: string[]) {
    if (!ids.length) return [];
    const db = getFirestore();
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

/** Read dates and tags only for the visible page, after checking project visibility. */
export async function addProjectCardDetails<T extends { userUid: string }>(
    projects: T[],
    projectId: (project: T) => string
) {
    const db = getFirestore();
    const dates = new Map<string, number>();
    const ids = [...new Set(projects.map(projectId))];
    for (let index = 0; index < ids.length; index += 50) {
        const snapshots = await db.getAll(
            ...ids
                .slice(index, index + 50)
                .map((id) => db.collection("projectLastModified").doc(id))
        );
        for (const snapshot of snapshots) {
            const timestamp = snapshot.data()?.timestamp;
            const millis = timestamp?.toMillis?.();
            if (typeof millis === "number" && Number.isFinite(millis))
                dates.set(snapshot.id, millis);
        }
    }
    return Promise.all(
        projects.map(async (project) => {
            const tags = project.userUid
                ? await db
                      .collection("tags")
                      .where(projectId(project), "==", project.userUid)
                      .get()
                : undefined;
            return {
                ...project,
                lastModified: dates.get(projectId(project)) ?? null,
                tags: tags?.docs.map((tag) => tag.id) ?? []
            };
        })
    );
}
