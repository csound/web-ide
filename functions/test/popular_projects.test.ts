// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { popularProjects } from "../src/popular_projects";

const { records, collection } = vi.hoisted(() => {
    const records = {
        projects: new Map<string, Record<string, unknown>>(),
        stars: new Map<string, Record<string, unknown>>()
    };
    const collection = vi.fn((name: keyof typeof records) => {
        const snapshot = (entries: [string, Record<string, unknown>][]) => ({
            docs: entries.map(([id, data]) => ({ id, data: () => data }))
        });
        return {
            get: async () => snapshot([...records[name]]),
            where: (field: string, operator: string, value: unknown) => {
                expect([name, field, operator, value]).toEqual([
                    "projects",
                    "public",
                    "==",
                    true
                ]);
                return {
                    get: async () =>
                        snapshot(
                            [...records[name]].filter(
                                ([, data]) => data[field] === value
                            )
                        )
                };
            }
        };
    });
    return { records, collection };
});

vi.mock("firebase-admin", () => ({
    default: { firestore: () => ({ collection }) }
}));
vi.mock("firebase-functions/v2/https", () => ({
    onCall: (_options: unknown, run: unknown) => ({ run })
}));

const fetchPopular = (count?: number) =>
    popularProjects.run({ data: { count }, rawRequest: {} } as Parameters<
        typeof popularProjects.run
    >[0]);
const addProject = (id: string, stars: number, isPublic = true) => {
    records.projects.set(id, {
        name: id,
        userUid: "author",
        public: isPublic,
        description: "A public project"
    });
    records.stars.set(
        id,
        Object.fromEntries(
            Array.from({ length: stars }, (_, index) => ["voter" + index, 123])
        )
    );
};

beforeEach(() => {
    records.projects.clear();
    records.stars.clear();
    collection.mockClear();
});

describe("popular projects", () => {
    it("ranks by real star counts, excludes private and deleted projects, and resolves ties consistently", async () => {
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

    it("finds top projects beyond the old 200-record sample and bounds the result size", async () => {
        for (let i = 0; i < 205; i++) addProject("project" + i, 1);
        addProject("winner", 10);
        expect((await fetchPopular())[0].projectUid).toBe("winner");
        expect(await fetchPopular()).toHaveLength(8);
        expect(await fetchPopular(2)).toHaveLength(2);
        expect(await fetchPopular(100)).toHaveLength(50);
        expect(await fetchPopular(0)).toHaveLength(1);
        expect(await fetchPopular(Number.NaN)).toHaveLength(8);
    });

    it("reflects unstars and privacy changes on the next request", async () => {
        addProject("first", 3);
        addProject("second", 2);
        expect((await fetchPopular())[0].projectUid).toBe("first");
        records.stars.set("first", {});
        records.projects.set("second", { public: false });
        expect(await fetchPopular()).toEqual([]);
    });

    it("ignores stale star totals stored on the project itself", async () => {
        records.projects.set("stale", { public: true, stars: 20 });
        expect(await fetchPopular()).toEqual([]);
    });
});
