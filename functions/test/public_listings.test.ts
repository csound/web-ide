// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => {
    const records = new Map<string, Record<string, any>>();
    const queries = vi.fn();
    const getAll = vi.fn();
    const reference = (path: string) => ({ path, id: path.split("/").at(-1) });
    const snapshot = (ref: ReturnType<typeof reference>) => ({
        ...ref,
        exists: records.has(ref.path),
        data: () =>
            records.has(ref.path) ? { ...records.get(ref.path) } : undefined
    });
    const query = (name: string, filters: any[] = [], limit?: number) => ({
        doc: (id: string) => reference(`${name}/${id}`),
        where: (field: string, op: string, value: unknown) =>
            query(name, [...filters, [field, op, value]], limit),
        orderBy: () => query(name, filters, limit),
        limit: (count: number) => query(name, filters, count),
        get: async () => {
            const entries = [...records].filter(
                ([path, data]) =>
                    path.startsWith(`${name}/`) &&
                    filters.every(([field, op, value]) => {
                        const actual =
                            field === "__name__"
                                ? path.split("/").at(-1)
                                : data[field];
                        return op === "in"
                            ? value.includes(actual)
                            : actual === value;
                    })
            );
            const selected =
                limit === undefined ? entries : entries.slice(0, limit);
            queries(name, selected.length);
            const docs = selected.map(([path, data]) => ({
                ...snapshot(reference(path)),
                data: () => ({ ...data })
            }));
            return {
                docs,
                empty: !docs.length,
                forEach: (fn: (doc: unknown) => void) => docs.forEach(fn)
            };
        }
    });
    const database = { collection: (name: string) => query(name), getAll };
    return { records, queries, getAll, database, snapshot };
});
vi.mock("firebase-admin/firestore", () => ({
    getFirestore: () => fixture.database,
    FieldPath: { documentId: () => "__name__" }
}));
vi.mock("firebase-functions/logger", () => ({ log: vi.fn() }));

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
    fixture.records.clear();
    fixture.records.set("projects/fixture-project", {
        name: "Fixture Melody",
        description: "Public description",
        userUid: "fixture-user",
        public: true,
        created: { toMillis: () => 123 },
        internalField: "not public metadata"
    });
    fixture.records.set("profiles/fixture-user", {
        username: "fixture-user",
        displayName: "Fixture User"
    });
    fixture.getAll.mockImplementation(async (...refs) =>
        refs.map(fixture.snapshot)
    );
});
afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});
const request = (data: unknown) => ({ data }) as any;
const projectQueries = () =>
    fixture.queries.mock.calls.filter(([name]) => name === "projects");

it.each([false, undefined])(
    "random projects rechecks a cached project after public changes to %s",
    async (visibility) => {
        const { randomProjects } = await import("../src/random_projects");
        await randomProjects.run(request({ count: 1 }));
        if (visibility === undefined)
            fixture.records.delete("projects/fixture-project");
        else
            fixture.records.get("projects/fixture-project")!.public =
                visibility;
        expect(await randomProjects.run(request({ count: 1 }))).toEqual([]);
    }
);

it("random projects clears an empty refresh and caches that empty result", async () => {
    const { randomProjects } = await import("../src/random_projects");
    await randomProjects.run(request({ count: 1 }));
    fixture.records.clear();
    vi.advanceTimersByTime(6 * 60 * 1000);
    expect(await randomProjects.run(request({ count: 1 }))).toEqual([]);
    expect(await randomProjects.run(request({ count: 1 }))).toEqual([]);
    expect(projectQueries()).toHaveLength(2);
});

it("random listings return only public summary fields", async () => {
    const { randomProjects } = await import("../src/random_projects");
    const results = await randomProjects.run(request({ count: 1 }));
    expect(results[0]).not.toHaveProperty("internalField");
});

it.each([8, 50])(
    "random listings refill from remaining public candidates for a count of %s",
    async (count) => {
        vi.spyOn(Math, "random").mockReturnValue(0.999);
        const template = fixture.records.get("projects/fixture-project")!;
        fixture.records.clear();
        for (let index = 0; index < 12; index++) {
            fixture.records.set(`projects/fixture-${index}`, { ...template });
        }
        const { randomProjects } = await import("../src/random_projects");
        await randomProjects.run(request({ count }));
        fixture.records.get("projects/fixture-0")!.public = false;
        fixture.records.delete("projects/fixture-1");
        fixture.records.get("projects/fixture-3")!.public = false;
        fixture.records.delete("projects/fixture-4");
        fixture.getAll.mockClear();
        const result = await randomProjects.run(request({ count }));
        expect(result.map((project) => project.projectUid)).toEqual(
            [2, 5, 6, 7, 8, 9, 10, 11].map((index) => `fixture-${index}`)
        );
        const reads = fixture.getAll.mock.calls
            .flat()
            .map((ref) => ref.path)
            .filter((path) => path.startsWith("projects/"));
        expect(reads).toHaveLength(new Set(reads).size);
        expect(reads.length).toBeLessThanOrEqual(12);
        expect(projectQueries()).toHaveLength(1);
    }
);

it.each([
    { starCount: undefined, stars: { "fixture-user": true }, expected: 0 },
    { starCount: undefined, stars: "12", expected: 0 },
    { starCount: undefined, stars: Number.NaN, expected: 0 },
    { starCount: undefined, stars: Infinity, expected: 0 },
    { starCount: Infinity, stars: 3, expected: 3 },
    { starCount: Number.NaN, stars: 3, expected: 3 },
    { starCount: undefined, stars: 3, expected: 3 },
    { starCount: 0, stars: 3, expected: 0 },
    { starCount: 2, stars: 3, expected: 2 }
])(
    "public listings return a finite star count for %j",
    async ({ starCount, stars, expected }) => {
        Object.assign(fixture.records.get("projects/fixture-project")!, {
            starCount,
            stars
        });
        const { randomProjects } = await import("../src/random_projects");
        const random = await randomProjects.run(request({ count: 1 }));
        expect(random[0].starCount).toBe(expected);
        const { searchProjects } = await import("../src/search_projects");
        const search = await searchProjects.run(
            request({ query: "Fixture Melody", sortBy: "stars" })
        );
        expect(search.data[0].stars).toBe(expected);
    }
);

it.each([false, undefined])(
    "search rechecks cached matches after public changes to %s",
    async (visibility) => {
        const { searchProjects } = await import("../src/search_projects");
        await searchProjects.run(request({ query: "Fixture Melody" }));
        if (visibility === undefined)
            fixture.records.delete("projects/fixture-project");
        else
            fixture.records.get("projects/fixture-project")!.public =
                visibility;
        const result = await searchProjects.run(
            request({ query: "Fixture Melody" })
        );
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
    }
);

it("different and concurrent searches share one catalogue load", async () => {
    const { searchProjects } = await import("../src/search_projects");
    await Promise.all(
        ["Fixture", "Melody", "description"].map((query) =>
            searchProjects.run(request({ query }))
        )
    );
    await searchProjects.run(request({ query: "new query" }));
    expect(projectQueries()).toHaveLength(1);
});

it("search returns fresh metadata and fails closed if a visibility read fails", async () => {
    const { searchProjects } = await import("../src/search_projects");
    await searchProjects.run(request({ query: "Fixture Melody" }));
    fixture.records.get("projects/fixture-project")!.description =
        "Updated description";
    expect(
        (await searchProjects.run(request({ query: "Fixture Melody" }))).data[0]
            .description
    ).toBe("Updated description");
    fixture.getAll.mockRejectedValueOnce(new Error("Read unavailable"));
    await expect(
        searchProjects.run(request({ query: "Fixture Melody" }))
    ).rejects.toThrow("Read unavailable");
});

it("search rejects oversized queries and non-integer pagination without reading", async () => {
    const { searchProjects } = await import("../src/search_projects");
    for (const data of [
        { query: "x".repeat(201) },
        { query: "melody", limit: "50" },
        { query: "melody", offset: 0.5 }
    ]) {
        await expect(searchProjects.run(request(data))).rejects.toMatchObject({
            code: "invalid-argument"
        });
    }
    expect(fixture.queries).not.toHaveBeenCalled();
});

it("search includes older projects beyond the first thousand and batches reads", async () => {
    const template = fixture.records.get("projects/fixture-project")!;
    fixture.records.clear();
    for (let index = 0; index < 1001; index++) {
        fixture.records.set(`projects/fixture-${index}`, {
            ...template,
            name: `Melody ${index}`,
            userUid: `artist-${index}`
        });
    }
    const { searchProjects } = await import("../src/search_projects");
    const result = await searchProjects.run(
        request({ query: "Melody", limit: 50, offset: 1000 })
    );
    expect(result.totalRecords).toBe(1001);
    expect(result.data).toHaveLength(1);
    expect(projectQueries()).toEqual([["projects", 1001]]);
    expect(fixture.getAll.mock.calls.every((refs) => refs.length <= 50)).toBe(
        true
    );
});

it("search fills pages and counts only visible matches, including outside the requested page", async () => {
    const template = fixture.records.get("projects/fixture-project")!;
    fixture.records.clear();
    for (let index = 0; index < 12; index++) {
        fixture.records.set(`projects/fixture-${index}`, {
            ...template,
            name: `Melody ${String(index).padStart(2, "0")}`
        });
    }
    const { searchProjects } = await import("../src/search_projects");
    const params = {
        query: "Melody",
        sortBy: "name",
        sortOrder: "asc",
        limit: 8
    };
    await searchProjects.run(request(params));
    fixture.records.get("projects/fixture-0")!.public = false;
    fixture.records.delete("projects/fixture-1");
    fixture.records.get("projects/fixture-11")!.public = false;
    const first = await searchProjects.run(request(params));
    expect(first.data.map((project) => project.id)).toEqual(
        Array.from({ length: 8 }, (_, index) => `fixture-${index + 2}`)
    );
    expect(first.totalRecords).toBe(9);
    const next = await searchProjects.run(request({ ...params, offset: 8 }));
    expect(next.data.map((project) => project.id)).toEqual(["fixture-10"]);
    expect(next.totalRecords).toBe(9);
});

it("an offset beyond the results cannot reveal a now-private project's cached count", async () => {
    const { searchProjects } = await import("../src/search_projects");
    await searchProjects.run(request({ query: "Fixture Melody" }));
    fixture.records.get("projects/fixture-project")!.public = false;
    const response = await searchProjects.run(
        request({ query: "Fixture Melody", offset: 100 })
    );
    expect(response.data).toEqual([]);
    expect(response.totalRecords).toBe(0);
});

it("empty search catalogues do not trigger repeated scans", async () => {
    fixture.records.clear();
    const { searchProjects } = await import("../src/search_projects");
    for (const query of ["Melody", "Rhythm", "Harmony"]) {
        expect((await searchProjects.run(request({ query }))).data).toEqual([]);
    }
    expect(projectQueries()).toHaveLength(1);
});

it.each(["search", "random", "artists", "popular"])(
    "%s rejects excess requests before database reads",
    async (kind) => {
        const invoke =
            kind === "search"
                ? (await import("../src/search_projects")).searchProjects.run
                : kind === "random"
                  ? (await import("../src/random_projects")).randomProjects.run
                  : kind === "artists"
                    ? (await import("../src/popular_artists")).popularArtists
                          .run
                    : (await import("../src/popular_projects")).popularProjects
                          .run;
        for (let index = 0; index < 30; index++) {
            await invoke(request({ count: 1, query: `Melody ${index}` }));
        }
        fixture.queries.mockClear();
        fixture.getAll.mockClear();
        await expect(
            invoke(request({ count: 1, query: "another query" }))
        ).rejects.toMatchObject({ code: "resource-exhausted" });
        expect(fixture.queries).not.toHaveBeenCalled();
        expect(fixture.getAll).not.toHaveBeenCalled();
    }
);

it("artist requests share a scan and cache an empty catalogue", async () => {
    fixture.records.clear();
    const { popularArtists } = await import("../src/popular_artists");
    await Promise.all(
        [1, 2, 3].map((count) => popularArtists.run(request({ count })))
    );
    expect(projectQueries()).toHaveLength(1);
    expect(
        fixture.queries.mock.calls.filter(([name]) => name === "stars")
    ).toHaveLength(1);
});

it("returns fresh saved edit dates for public cards and search results", async () => {
    fixture.records.set("projectLastModified/fixture-project", {
        timestamp: { toMillis: () => 456 }
    });
    const { randomProjects } = await import("../src/random_projects");
    expect((await randomProjects.run(request({ count: 1 })))[0]).toMatchObject({
        created: { toMillis: expect.any(Function) },
        lastModified: 456
    });
    fixture.records.set("projectLastModified/fixture-project", {
        timestamp: { toMillis: () => 789 }
    });
    const { searchProjects } = await import("../src/search_projects");
    expect(
        (await searchProjects.run(request({ query: "Fixture Melody" }))).data[0]
            .lastModified
    ).toBe(789);
});
it("keeps missing edit dates unknown and reads dates only for the returned search page", async () => {
    const template = fixture.records.get("projects/fixture-project")!;
    for (let i = 0; i < 20; i++)
        fixture.records.set(`projects/example-${i}`, { ...template });
    const { searchProjects } = await import("../src/search_projects");
    const result = await searchProjects.run(
        request({ query: "Fixture Melody", limit: 2 })
    );
    expect(result.data.map((project) => project.lastModified)).toEqual([
        null,
        null
    ]);
    const ids = fixture.getAll.mock.calls
        .flat()
        .map((ref) => ref.path)
        .filter((path) => path.startsWith("projectLastModified/"));
    expect(ids).toHaveLength(2);
    expect(ids.sort()).toEqual(
        result.data.map((project) => `projectLastModified/${project.id}`).sort()
    );
});

it("returns tags only for visible random projects and the current search page", async () => {
    const { randomProjects } = await import("../src/random_projects");
    const { searchProjects } = await import("../src/search_projects");
    fixture.records.set("tags/ambient", { "fixture-project": "fixture-user" });
    fixture.records.set("tags/wrong-owner", {
        "fixture-project": "another-user"
    });
    fixture.records.set("tags/private-tag", { hidden: "fixture-user" });
    expect((await randomProjects.run(request({ count: 1 })))[0].tags).toEqual([
        "ambient"
    ]);
    const results = await searchProjects.run(
        request({ query: "Fixture Melody" })
    );
    expect(results.data[0].tags).toEqual(["ambient"]);
    fixture.queries.mockClear();
    await searchProjects.run(request({ query: "Fixture Melody", offset: 100 }));
    expect(
        fixture.queries.mock.calls.filter(([name]) => name === "tags")
    ).toHaveLength(0);
    fixture.records.get("projects/fixture-project")!.public = false;
    expect(await randomProjects.run(request({ count: 1 }))).toEqual([]);
    expect(
        fixture.queries.mock.calls.filter(([name]) => name === "tags")
    ).toHaveLength(0);
});
