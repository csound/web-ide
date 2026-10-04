// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { popularProjects } from "../src/popular_projects";
import { toggleProjectStar } from "../src/toggle_project_star";
import { projectStarsCounter } from "../src/project_stars_counter";
import { syncProjectStarCount } from "../src/project_stars";

const { records, database, reads, deleteValue } = vi.hoisted(() => {
    const records = {
        projects: new Map<string, Record<string, unknown>>(),
        projectLastModified: new Map<string, Record<string, unknown>>(),
        stars: new Map<string, Record<string, unknown>>(),
        profileStars: new Map<string, Record<string, unknown>>()
    };
    type Collection = keyof typeof records;
    const reads = vi.fn();
    const deleteValue = Symbol("delete");
    const reference = (collection: Collection, id: string) => ({
        collection,
        id
    });
    type Reference = ReturnType<typeof reference>;
    const snapshot = (ref: Reference) => {
        const data = records[ref.collection].get(ref.id);
        return {
            id: ref.id,
            ref,
            exists: !!data,
            data: () => data && { ...data }
        };
    };
    const query = (
        name: Collection,
        filters: [string, string, unknown][] = [],
        orders: [string, string][] = [],
        limit?: number
    ) => ({
        doc: (id: string) => reference(name, id),
        where: (field: string, op: string, value: unknown) =>
            query(name, [...filters, [field, op, value]], orders, limit),
        orderBy: (field: string, direction: string) =>
            query(name, filters, [...orders, [field, direction]], limit),
        limit: (count: number) => query(name, filters, orders, count),
        get: async () => {
            let entries = [...records[name]].filter(
                ([, data]) =>
                    filters.every(([field, op, value]) =>
                        op === "=="
                            ? data[field] === value
                            : Number(data[field]) > Number(value)
                    ) &&
                    orders.every(
                        ([field]) => field === "__name__" || field in data
                    )
            );
            entries.sort(([aId, a], [bId, b]) => {
                for (const [field, direction] of orders) {
                    const left = field === "__name__" ? aId : a[field];
                    const right = field === "__name__" ? bId : b[field];
                    const comparison = left < right ? -1 : left > right ? 1 : 0;
                    if (comparison)
                        return comparison * (direction === "desc" ? -1 : 1);
                }
                return 0;
            });
            if (limit !== undefined) entries = entries.slice(0, limit);
            reads(name, entries.length);
            return {
                docs: entries.map(([id]) => snapshot(reference(name, id)))
            };
        }
    });
    const database = {
        getAll: vi.fn(async (...refs: Reference[]) => refs.map(snapshot)),
        collection: vi.fn((name: Collection) => query(name)),
        runTransaction: async (
            callback: (transaction: any) => Promise<unknown>
        ) => {
            const writes: Array<() => void> = [];
            const write = (
                ref: Reference,
                value: Record<string, unknown>,
                merge: boolean
            ) => {
                writes.push(() => {
                    const data = merge
                        ? { ...records[ref.collection].get(ref.id) }
                        : {};
                    for (const [key, entry] of Object.entries(value)) {
                        if (entry === deleteValue) delete data[key];
                        else data[key] = entry;
                    }
                    records[ref.collection].set(ref.id, data);
                });
            };
            const result = await callback({
                getAll: async (...refs: Reference[]) => {
                    if (writes.length) throw new Error("Read after write");
                    return refs.map(snapshot);
                },
                set: (
                    ref: Reference,
                    data: Record<string, unknown>,
                    options?: { merge: boolean }
                ) => write(ref, data, !!options?.merge),
                update: (ref: Reference, data: Record<string, unknown>) =>
                    write(ref, data, true)
            });
            writes.forEach((write) => write());
            return result;
        }
    };
    return { records, database, reads, deleteValue };
});

vi.mock("firebase-admin", () => ({ default: { firestore: () => database } }));
vi.mock("firebase-admin/firestore", () => ({
    FieldPath: { documentId: () => "__name__" },
    FieldValue: { serverTimestamp: () => 123, delete: () => deleteValue }
}));
vi.mock("firebase-functions/v2/https", async (importOriginal) => ({
    ...(await importOriginal<typeof import("firebase-functions/v2/https")>()),
    onCall: (_options: unknown, run: unknown) => ({ run })
}));
vi.mock("firebase-functions/v2/firestore", () => ({
    onDocumentWritten: (_options: unknown, run: unknown) => ({ run })
}));

const fetchPopular = (count?: number) =>
    popularProjects.run({ data: { count }, rawRequest: {} } as Parameters<
        typeof popularProjects.run
    >[0]);
const toggle = (projectUid: unknown, uid: string | undefined = "voter0") =>
    toggleProjectStar.run({
        data: { projectUid },
        auth: uid ? { uid } : undefined
    } as Parameters<typeof toggleProjectStar.run>[0]);
const addProject = (id: string, stars: number, isPublic = true) => {
    records.projects.set(id, {
        name: id,
        userUid: "author",
        public: isPublic,
        description: "A public project",
        starCount: stars
    });
    records.stars.set(
        id,
        Object.fromEntries(
            Array.from({ length: stars }, (_, index) => ["voter" + index, 123])
        )
    );
};
const sync = (id: string, apply = true) =>
    syncProjectStarCount(database as never, id, apply);

beforeEach(() => {
    Object.values(records).forEach((collection) => collection.clear());
    vi.clearAllMocks();
});

describe("popular projects", () => {
    it("ranks current public projects and resolves ties consistently", async () => {
        addProject("second", 2);
        addProject("first-b", 5);
        addProject("first-a", 5);
        addProject("private", 100, false);
        addProject("unstarred", 0);
        records.stars.set("deleted", { voter: 1 });
        const results = await fetchPopular();
        expect(
            results.map(({ projectUid, starCount }) => [projectUid, starCount])
        ).toEqual([
            ["first-a", 5],
            ["first-b", 5],
            ["second", 2]
        ]);
        expect(results[0]).toMatchObject({
            name: "first-a",
            userUid: "author",
            public: true
        });
    });

    it("finds top projects beyond the old sample and bounds both reads and results", async () => {
        for (let i = 0; i < 250; i++) addProject("project" + i, 1);
        addProject("winner", 10);
        expect((await fetchPopular(2))[0].projectUid).toBe("winner");
        expect(reads.mock.calls).toEqual([["projects", 2]]);
        expect(database.collection).not.toHaveBeenCalledWith("stars");
        expect(await fetchPopular()).toHaveLength(8);
        expect(await fetchPopular(100)).toHaveLength(50);
        expect(await fetchPopular(0)).toHaveLength(1);
        expect(await fetchPopular(Number.NaN)).toHaveLength(8);
    });

    it("reflects stars, unstars, privacy changes, and deletion on the next request", async () => {
        addProject("first", 1);
        addProject("second", 0);
        expect((await fetchPopular())[0].projectUid).toBe("first");
        await toggle("first");
        await toggle("second");
        expect(
            (await fetchPopular()).map(({ projectUid }) => projectUid)
        ).toEqual(["second"]);
        records.projects.get("second").public = false;
        expect(await fetchPopular()).toEqual([]);
        records.projects.get("second").public = true;
        expect(await fetchPopular()).toHaveLength(1);
        records.projects.delete("second");
        expect(await fetchPopular()).toEqual([]);
    });

    it("ignores the old, unmaintained stars field", async () => {
        records.projects.set("stale", { public: true, stars: 20 });
        expect(await fetchPopular()).toEqual([]);
    });
});

describe("star writes", () => {
    it("updates both star records and repairs the total in the same transaction", async () => {
        addProject("project", 1);
        records.projects.get("project").starCount = 99;
        expect(await toggle("project", "new-voter")).toEqual({
            starred: true,
            starCount: 2
        });
        expect(records.stars.get("project")).toEqual({
            voter0: 123,
            "new-voter": 123
        });
        expect(records.profileStars.get("new-voter")).toEqual({ project: 123 });
        expect(records.projects.get("project").starCount).toBe(2);
        expect(await toggle("project", "new-voter")).toEqual({
            starred: false,
            starCount: 1
        });
        expect(records.stars.get("project")).toEqual({ voter0: 123 });
        expect(records.profileStars.get("new-voter")).toEqual({});
        expect(records.projects.get("project").starCount).toBe(1);
    });

    it("can unstar when the profile star record is missing", async () => {
        addProject("project", 1);
        await toggle("project");
        expect(records.projects.get("project").starCount).toBe(0);
        expect(records.stars.get("project")).toEqual({});
    });

    it("rejects unauthenticated callers and missing projects without writes", async () => {
        await expect(toggle("project", "")).rejects.toMatchObject({
            code: "unauthenticated"
        });
        await expect(toggle("project")).rejects.toMatchObject({
            code: "not-found"
        });
        expect(
            records.projects.size +
                records.stars.size +
                records.profileStars.size
        ).toBe(0);
    });

    it.each([undefined, "", "bad/id", ".", "..", 123, "x".repeat(1501)])(
        "rejects invalid project ID %j",
        async (id) => {
            await expect(toggle(id)).rejects.toMatchObject({
                code: "invalid-argument"
            });
            expect(database.collection).not.toHaveBeenCalled();
        }
    );

    it("lets owners star private projects and existing voters remove their stars", async () => {
        addProject("private", 1, false);
        await expect(toggle("private", "stranger")).rejects.toMatchObject({
            code: "permission-denied"
        });
        expect(records.projects.get("private").starCount).toBe(1);
        await toggle("private", "author");
        await toggle("private", "voter0");
        expect(records.stars.get("private")).toEqual({ author: 123 });
        expect(records.projects.get("private").starCount).toBe(1);
    });
});

describe("legacy writes and backfill", () => {
    it("reconciles the current records even if an older event arrives twice", async () => {
        addProject("project", 1);
        records.stars.set("project", {});
        const event = {
            params: { projectUid: "project" },
            data: { after: { data: () => ({ old: 123 }) } }
        };
        await projectStarsCounter.run(event as never);
        await projectStarsCounter.run(event as never);
        expect(records.projects.get("project").starCount).toBe(0);
    });

    it("treats a deleted stars record as zero without recreating deleted projects", async () => {
        addProject("project", 4);
        records.stars.delete("project");
        await sync("project");
        expect(records.projects.get("project").starCount).toBe(0);
        records.projects.delete("project");
        await sync("project");
        expect(records.projects.has("project")).toBe(false);
    });

    it("audits and backfills missing totals without changing project or star data", async () => {
        records.projects.set("project", { public: true, name: "Keep this" });
        records.stars.set("project", { a: 1, b: 2 });
        expect(await sync("project", false)).toMatchObject({
            changed: true,
            starCount: 2
        });
        expect(records.projects.get("project")).not.toHaveProperty("starCount");
        await sync("project");
        expect(records.projects.get("project")).toEqual({
            public: true,
            name: "Keep this",
            starCount: 2
        });
        expect(records.stars.get("project")).toEqual({ a: 1, b: 2 });
        expect(await sync("project")).toMatchObject({ changed: false });
    });
});

it("includes saved edit dates on popular cards", async () => {
    addProject("dated", 3);
    records.projectLastModified.set("dated", {
        timestamp: { toMillis: () => 987654321 }
    });
    expect((await fetchPopular())[0].lastModified).toBe(987654321);
});
