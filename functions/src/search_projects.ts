import admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import Fuse, { IFuseOptions } from "fuse.js";
import {
    createReadCache,
    createRequestLimiter,
    publicCallableOptions
} from "./public_requests.js";
import {
    addProjectCardDetails,
    readPublicProjectSummaries
} from "./public_project_summaries.js";

// TypeScript interfaces for search functionality
export interface SearchProjectsParams {
    query: string;
    offset?: number;
    limit?: number;
    sortBy?: "name" | "created" | "stars";
    sortOrder?: "asc" | "desc";
}

export interface ProjectSearchResult {
    id: string;
    name: string;
    description: string;
    userUid: string;
    username?: string;
    displayName?: string;
    created: FirebaseFirestore.Timestamp;
    lastModified?: number | null;
    forkedFrom?: string;
    forkedAt?: FirebaseFirestore.Timestamp;
    public: boolean;
    iconName: string;
    iconBackgroundColor: string;
    iconForegroundColor: string;
    stars?: number;
}

export interface SearchResponse {
    data: ProjectSearchResult[];
    totalRecords: number;
    offset: number;
    limit: number;
    query: string;
}

// Fuse.js configuration for fuzzy search
const fuseOptions: IFuseOptions<ProjectSearchResult> = {
    keys: [
        { name: "name", weight: 0.4 },
        { name: "description", weight: 0.3 },
        { name: "username", weight: 0.2 },
        { name: "displayName", weight: 0.1 }
    ],
    threshold: 0.4, // Lower threshold = more strict matching
    distance: 100,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true
};

// Sort function for search results
function sortResults(
    results: ProjectSearchResult[],
    sortBy: string,
    sortOrder: string
): ProjectSearchResult[] {
    return results.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case "name":
                comparison = a.name.localeCompare(b.name);
                break;
            case "created":
                comparison = a.created.toMillis() - b.created.toMillis();
                break;
            case "stars":
                comparison = (a.stars || 0) - (b.stars || 0);
                break;
            default:
                comparison = a.name.localeCompare(b.name);
        }

        return sortOrder === "desc" ? -comparison : comparison;
    });
}

async function readProfiles(ids: string[]) {
    const db = admin.firestore();
    const profiles: Record<string, FirebaseFirestore.DocumentData> = {};
    const userIds = [...new Set(ids)].filter(
        (id) => typeof id === "string" && id && !id.includes("/")
    );
    for (let index = 0; index < userIds.length; index += 50) {
        const batch = userIds.slice(index, index + 50);
        const snapshots = await db.getAll(
            ...batch.map((id) => db.collection("profiles").doc(id))
        );
        for (const snapshot of snapshots) {
            if (snapshot.exists) profiles[snapshot.id] = snapshot.data()!;
        }
    }
    return profiles;
}

function searchResult(
    id: string,
    project: FirebaseFirestore.DocumentData,
    profile: FirebaseFirestore.DocumentData = {}
): ProjectSearchResult {
    return {
        id,
        name: typeof project.name === "string" ? project.name : "",
        description:
            typeof project.description === "string" ? project.description : "",
        userUid: project.userUid || "",
        username: typeof profile.username === "string" ? profile.username : "",
        displayName:
            typeof profile.displayName === "string" ? profile.displayName : "",
        created: project.created,
        public: true,
        ...(typeof project.forkedFrom === "string"
            ? {
                  forkedFrom: project.forkedFrom,
                  forkedAt: project.forkedAt ?? null
              }
            : {}),
        iconName: project.iconName || "",
        iconBackgroundColor: project.iconBackgroundColor || "",
        iconForegroundColor: project.iconForegroundColor || "",
        stars: project.starCount ?? project.stars ?? 0
    };
}

const acceptRequest = createRequestLimiter();
// All queries share one full catalogue, including requests during its refresh.
// Cached fields are used only to find candidates, never as response data.
const loadIndex = createReadCache(async () => {
    const snapshot = await admin
        .firestore()
        .collection("projects")
        .where("public", "==", true)
        .get();
    const profiles = await readProfiles(
        snapshot.docs.map((doc) => doc.data().userUid)
    );
    return new Fuse(
        snapshot.docs.map((doc) => {
            const project = doc.data();
            return searchResult(doc.id, project, profiles[project.userUid]);
        }),
        fuseOptions
    );
});

export const searchProjects = onCall<SearchProjectsParams>(
    publicCallableOptions,
    async ({ data }): Promise<SearchResponse> => {
        const {
            query,
            offset = 0,
            limit = 8,
            sortBy = "name",
            sortOrder = "desc"
        } = data ?? {};
        if (
            typeof query !== "string" ||
            !query.trim() ||
            query.length > 200 ||
            !Number.isSafeInteger(offset) ||
            offset < 0 ||
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 50 ||
            !["name", "created", "stars"].includes(sortBy) ||
            !["asc", "desc"].includes(sortOrder)
        ) {
            throw new HttpsError(
                "invalid-argument",
                "Choose a search query and valid pagination."
            );
        }
        acceptRequest();
        const trimmedQuery = query.trim();
        const index = await loadIndex();
        const matches = index.search(trimmedQuery).map((result) => result.item);
        // Validate all matches before counting or paging: even an out-of-range
        // offset must not disclose a hidden project's cached presence.
        const projects = await readPublicProjectSummaries(
            matches.map((project) => project.id)
        );
        const visibleIds = new Set(
            projects.map((project) => project.projectUid)
        );
        const hiddenIds = new Set(
            matches
                .filter((project) => !visibleIds.has(project.id))
                .map((project) => project.id)
        );
        // Stop future queries matching projects we now know are hidden or deleted.
        index.remove((project) => hiddenIds.has(project.id));
        const page = sortResults(
            projects.map((project) =>
                searchResult(project.projectUid, project)
            ),
            sortBy,
            sortOrder
        ).slice(offset, offset + limit);
        const profiles = await readProfiles(
            page.map((project) => project.userUid)
        );
        return {
            data: await addProjectCardDetails(
                page.map((project) =>
                    searchResult(project.id, project, profiles[project.userUid])
                ),
                (project) => project.id
            ),
            totalRecords: projects.length,
            offset,
            limit,
            query: trimmedQuery
        };
    }
);
