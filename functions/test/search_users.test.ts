// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => {
    const records = new Map<string, Record<string, any>>();
    const scans = vi.fn();
    const getAll = vi.fn();
    const reference = (path: string) => ({ path, id: path.split("/").at(-1)! });
    const snapshot = (
        ref: ReturnType<typeof reference>,
        fields?: string[]
    ) => ({
        id: ref.id,
        exists: records.has(ref.path),
        data: () => {
            const data = records.get(ref.path);
            if (!data) return undefined;
            return fields
                ? Object.fromEntries(
                      fields
                          .filter((field) => field in data)
                          .map((field) => [field, data[field]])
                  )
                : { ...data };
        }
    });
    const collection = (
        name: string,
        filter?: string[],
        fields?: string[]
    ): any => ({
        doc: (id: string) => reference(`${name}/${id}`),
        select: (...selected: string[]) => collection(name, filter, selected),
        where: (_field: string, _op: string, ids: string[]) =>
            collection(name, ids, fields),
        get: async () => {
            scans(name, fields);
            return {
                docs: [...records.keys()]
                    .filter(
                        (path) =>
                            path.startsWith(`${name}/`) &&
                            (!filter ||
                                filter.includes(records.get(path)!.userUid))
                    )
                    .map((path) => snapshot(reference(path), fields))
            };
        }
    });
    return { records, scans, getAll, snapshot, db: { collection, getAll } };
});
vi.mock("firebase-admin/firestore", () => ({ getFirestore: () => fixture.db }));

function profile(id: string, fields: Record<string, unknown> = {}) {
    fixture.records.set(`profiles/${id}`, {
        username: id,
        displayName: "Inés Valdés",
        bio: "Field recordings and granular synthesis.",
        link1: "https://ines.example/music",
        ...fields
    });
    fixture.records.set(`usernames/${id}`, { userUid: id });
}
const request = (data: unknown) => ({ data }) as any;
beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-04T12:00:00Z"));
    fixture.records.clear();
    fixture.getAll.mockImplementation(async (...args) => {
        const options = args.pop();
        return args.map((ref) => fixture.snapshot(ref, options.fieldMask));
    });
    profile("ines");
});
afterEach(() => vi.useRealTimers());

it.each([
    "ines",
    "@ines",
    "  INES  ",
    "Ines Valdes",
    "granuler",
    "ines.example"
])("finds users by public names, bio and websites: %s", async (query) => {
    const { searchUsers } = await import("../src/search_users");
    const result = await searchUsers.run(request({ query }));
    expect(result.data.map((user) => user.username)).toEqual(["ines"]);
});

it("searches bare website names while rejecting non-web URLs", async () => {
    Object.assign(fixture.records.get("profiles/ines")!, {
        link1: "www.soundgarden.example/music",
        link2: "mailto:private@example.org",
        link3: "javascript:alert(1)",
        photoUrl: "not-a-photo-url"
    });
    const { searchUsers } = await import("../src/search_users");
    const result = await searchUsers.run(request({ query: "soundgarden" }));
    expect(result.data[0].links).toEqual([
        "https://www.soundgarden.example/music"
    ]);
    expect(result.data[0].photoUrl).toBe("");
});

it("never indexes or returns private fields or Auth data", async () => {
    Object.assign(fixture.records.get("profiles/ines")!, {
        email: "private-contact@example.org",
        secret: "uniquesecrettext",
        photoUrl: "javascript:alert(1)",
        link2: "javascript:alert(2)"
    });
    fixture.records.set("users/private", { email: "hidden@example.org" });
    const { searchUsers } = await import("../src/search_users");
    expect(
        (await searchUsers.run(request({ query: "uniquesecrettext" }))).data
    ).toEqual([]);
    const result = await searchUsers.run(request({ query: "ines" }));
    expect(result.data[0]).toEqual({
        userUid: "ines",
        username: "ines",
        displayName: "Inés Valdés",
        bio: "Field recordings and granular synthesis.",
        links: ["https://ines.example/music"],
        photoUrl: ""
    });
    expect(
        fixture.scans.mock.calls.every(([collection]) => collection !== "users")
    ).toBe(true);
});

it("shares a single directory refresh across concurrent and different searches", async () => {
    const { searchUsers } = await import("../src/search_users");
    await Promise.all(
        ["ines", "granular", "recordings"].map((query) =>
            searchUsers.run(request({ query }))
        )
    );
    expect(fixture.scans).toHaveBeenCalledTimes(1);
    profile("marta", {
        displayName: "Marta Nowak",
        bio: "Bowed strings",
        link1: ""
    });
    expect((await searchUsers.run(request({ query: "marta" }))).data).toEqual(
        []
    );
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(
        (await searchUsers.run(request({ query: "marta" }))).data[0].username
    ).toBe("marta");
    expect(fixture.scans).toHaveBeenCalledTimes(2);
});

it("resolves a legacy username without creating or repairing any records", async () => {
    fixture.records.get("profiles/ines")!.username = undefined;
    const { searchUsers } = await import("../src/search_users");
    expect(
        (await searchUsers.run(request({ query: "ines" }))).data[0].username
    ).toBe("ines");
    expect(fixture.records.get("profiles/ines")!.username).toBeUndefined();
});

it.each(["deleted", "renamed", "address-reassigned", "bio-removed"])(
    "does not return a stale cached match after the profile is %s",
    async (change) => {
        const { searchUsers } = await import("../src/search_users");
        const query = change === "bio-removed" ? "granular" : "ines";
        await searchUsers.run(request({ query }));
        if (change === "deleted") fixture.records.delete("profiles/ines");
        if (change === "renamed") {
            fixture.records.set("profiles/ines", {
                username: "renamed",
                displayName: "New identity",
                bio: ""
            });
            fixture.records.delete("usernames/ines");
            fixture.records.set("usernames/renamed", { userUid: "ines" });
        }
        if (change === "address-reassigned")
            fixture.records.set("usernames/ines", { userUid: "someone-else" });
        if (change === "bio-removed")
            fixture.records.get("profiles/ines")!.bio = "";
        expect((await searchUsers.run(request({ query }))).data).toEqual([]);
    }
);

it("returns the current name and checks its address after a rename", async () => {
    const { searchUsers } = await import("../src/search_users");
    await searchUsers.run(request({ query: "granular" }));
    fixture.records.get("profiles/ines")!.username = "ines-sounds";
    fixture.records.delete("usernames/ines");
    fixture.records.set("usernames/ines-sounds", { userUid: "ines" });
    expect(
        (await searchUsers.run(request({ query: "granular" }))).data[0].username
    ).toBe("ines-sounds");
});

it("pages through all matches with bounded reads and refills deleted entries", async () => {
    for (let i = 0; i < 75; i++) profile(`artist-${i}`);
    const { searchUsers } = await import("../src/search_users");
    await searchUsers.run(request({ query: "granular" }));
    fixture.records.delete("profiles/ines");
    fixture.records.delete("profiles/artist-0");
    fixture.getAll.mockClear();
    const ids: string[] = [];
    let offset: number | null = 0;
    while (offset !== null) {
        const before = fixture.getAll.mock.calls.length;
        const page = await searchUsers.run(
            request({ query: "granular", offset, limit: 8 })
        );
        ids.push(...page.data.map((user) => user.userUid));
        const reads = fixture.getAll.mock.calls
            .slice(before)
            .reduce((sum, args) => sum + args.length - 1, 0);
        expect(reads).toBeLessThanOrEqual(100);
        expect(page.data.length).toBeLessThanOrEqual(8);
        if (page.nextOffset !== null)
            expect(page.nextOffset).toBeGreaterThan(offset);
        offset = page.nextOffset;
    }
    expect(ids).toHaveLength(74);
    expect(new Set(ids).size).toBe(74);
    expect(fixture.scans).toHaveBeenCalledTimes(1);
});

it("retains a continuation when many cached candidates have been deleted", async () => {
    for (let i = 0; i < 75; i++) profile(`artist-${i}`);
    const { searchUsers } = await import("../src/search_users");
    await searchUsers.run(request({ query: "granular" }));
    fixture.records.delete("profiles/ines");
    for (let i = 0; i < 60; i++) fixture.records.delete(`profiles/artist-${i}`);
    fixture.getAll.mockClear();
    const first = await searchUsers.run(request({ query: "granular" }));
    expect(first.data).toEqual([]);
    expect(first.nextOffset).toBe(50);
    expect(
        fixture.getAll.mock.calls.reduce(
            (sum, args) => sum + args.length - 1,
            0
        )
    ).toBe(50);
    const next = await searchUsers.run(
        request({ query: "granular", offset: first.nextOffset })
    );
    expect(next.data).toHaveLength(8);
});

it("fails closed on a fresh profile read error", async () => {
    const { searchUsers } = await import("../src/search_users");
    await searchUsers.run(request({ query: "ines" }));
    fixture.getAll.mockRejectedValueOnce(new Error("Unavailable"));
    await expect(searchUsers.run(request({ query: "ines" }))).rejects.toThrow(
        "Unavailable"
    );
});

it.each([
    null,
    {},
    { query: " " },
    { query: "@a" },
    { query: "x".repeat(201) },
    { query: "ines", offset: -1 },
    { query: "ines", offset: 0.5 },
    { query: "ines", limit: 21 },
    { query: "ines", limit: "8" }
])("rejects invalid requests before reading: %j", async (data) => {
    const { searchUsers } = await import("../src/search_users");
    await expect(searchUsers.run(request(data))).rejects.toMatchObject({
        code: "invalid-argument"
    });
    expect(fixture.scans).not.toHaveBeenCalled();
    expect(fixture.getAll).not.toHaveBeenCalled();
});

it("limits bursts before issuing more Firestore reads", async () => {
    const { searchUsers } = await import("../src/search_users");
    for (let i = 0; i < 30; i++)
        await searchUsers.run(request({ query: "ines" }));
    fixture.getAll.mockClear();
    await expect(
        searchUsers.run(request({ query: "ines" }))
    ).rejects.toMatchObject({ code: "resource-exhausted" });
    expect(fixture.getAll).not.toHaveBeenCalled();
});
