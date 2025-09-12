import admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { log } from "firebase-functions/logger";
import Fuse, { IFuseOptions } from "fuse.js";

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

// Cache configuration
interface CacheEntry {
    data: ProjectSearchResult[];
    timestamp: number;
    totalCount: number;
}

// In-memory cache with 5-minute TTL
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_SIZE = 100; // Maximum number of cached queries

// Cache cleanup function
function cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of searchCache.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
            expiredKeys.push(key);
        }
    }

    expiredKeys.forEach((key) => searchCache.delete(key));

    // If cache is still too large, remove oldest entries
    if (searchCache.size > MAX_CACHE_SIZE) {
        const entries = Array.from(searchCache.entries()).sort(
            (a, b) => a[1].timestamp - b[1].timestamp
        );

        const toRemove = entries.slice(0, searchCache.size - MAX_CACHE_SIZE);
        toRemove.forEach(([key]) => searchCache.delete(key));
    }
}

// Generate cache key
function getCacheKey(params: SearchProjectsParams): string {
    const {
        query,
        offset = 0,
        limit = 8,
        sortBy = "name",
        sortOrder = "desc"
    } = params;
    return `${query}:${offset}:${limit}:${sortBy}:${sortOrder}`;
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

// Main search function
export const searchProjects = onCall<SearchProjectsParams>(
    async ({ data }): Promise<SearchResponse> => {
        try {
            const {
                query,
                offset = 0,
                limit = 8,
                sortBy = "name",
                sortOrder = "desc"
            } = data;

            // Validate input parameters
            if (
                !query ||
                typeof query !== "string" ||
                query.trim().length === 0
            ) {
                throw new Error(
                    "Query parameter is required and must be a non-empty string"
                );
            }

            if (offset < 0 || limit <= 0 || limit > 50) {
                throw new Error("Invalid pagination parameters");
            }

            const trimmedQuery = query.trim();
            const cacheKey = getCacheKey({
                query: trimmedQuery,
                offset,
                limit,
                sortBy,
                sortOrder
            });

            // Check cache first
            cleanupCache();
            const cachedResult = searchCache.get(cacheKey);

            if (
                cachedResult &&
                Date.now() - cachedResult.timestamp < CACHE_TTL
            ) {
                log(`Cache hit for query: ${trimmedQuery}`);
                return {
                    data: cachedResult.data,
                    totalRecords: cachedResult.totalCount,
                    offset,
                    limit,
                    query: trimmedQuery
                };
            }

            log(`Performing search for query: ${trimmedQuery}`);

            const db = admin.firestore();

            // Fetch all public projects with user profiles
            const projectsSnapshot = await db
                .collection("projects")
                .where("public", "==", true)
                .get();

            if (projectsSnapshot.empty) {
                log("No public projects found");
                return {
                    data: [],
                    totalRecords: 0,
                    offset,
                    limit,
                    query: trimmedQuery
                };
            }

            // Get unique user IDs from projects
            const userIds = [
                ...new Set(
                    projectsSnapshot.docs.map((doc) => doc.data().userUid)
                )
            ];

            // Fetch user profiles in batches (Firestore 'in' query limit is 10)
            const profiles: Record<string, any> = {};
            const batchSize = 10;

            for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = userIds.slice(i, i + batchSize);
                const profilesSnapshot = await db
                    .collection("profiles")
                    .where(admin.firestore.FieldPath.documentId(), "in", batch)
                    .get();

                profilesSnapshot.docs.forEach((doc) => {
                    profiles[doc.id] = doc.data();
                });
            }

            // Prepare search data with user information
            const searchData: ProjectSearchResult[] = projectsSnapshot.docs.map(
                (doc) => {
                    const projectData = doc.data();
                    const userProfile = profiles[projectData.userUid] || {};

                    return {
                        id: doc.id,
                        name: projectData.name || "",
                        description: projectData.description || "",
                        userUid: projectData.userUid,
                        username: userProfile.username || "",
                        displayName: userProfile.displayName || "",
                        created: projectData.created,
                        public: projectData.public,
                        iconName: projectData.iconName || "",
                        iconBackgroundColor:
                            projectData.iconBackgroundColor || "",
                        iconForegroundColor:
                            projectData.iconForegroundColor || "",
                        stars: projectData.stars || 0
                    };
                }
            );

            // Perform fuzzy search using Fuse.js
            const fuse = new Fuse(searchData, fuseOptions);
            const fuseResults = fuse.search(trimmedQuery);

            // Extract items from Fuse results and sort
            let searchResults = fuseResults.map((result) => result.item);
            searchResults = sortResults(searchResults, sortBy, sortOrder);

            const totalRecords = searchResults.length;

            // Apply pagination
            const paginatedResults = searchResults.slice(
                offset,
                offset + limit
            );

            // Cache the full results (before pagination)
            searchCache.set(cacheKey, {
                data: paginatedResults,
                timestamp: Date.now(),
                totalCount: totalRecords
            });

            log(
                `Search completed. Found ${totalRecords} results for query: ${trimmedQuery}`
            );

            return {
                data: paginatedResults,
                totalRecords,
                offset,
                limit,
                query: trimmedQuery
            };
        } catch (error) {
            log(`Error in searchProjects function: ${error}`);
            throw new Error(
                `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    }
);
