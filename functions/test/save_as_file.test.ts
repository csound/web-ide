// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { saveAsFile } from "../src/save_as_file";
const fixture = vi.hoisted(() => {
    const records = new Map<string, Record<string, any>>();
    const versions = new Map<string, number>();
    const commits: string[][] = [];
    const beforeCommit = vi.fn();
    let nextId = 0;
    const write = (path: string, data?: Record<string, any>) => {
        if (data) records.set(path, structuredClone(data));
        else records.delete(path);
        versions.set(path, (versions.get(path) || 0) + 1);
    };
    const reference = (path: string): any => ({
        path,
        id: path.split("/").at(-1),
        collection: (name: string) => collection(`${path}/${name}`)
    });
    const collection = (path: string): any => ({
        path,
        doc: (id = `copy-${++nextId}`) => reference(`${path}/${id}`),
        select: (...fields: string[]) => ({ path, fields })
    });
    const db: any = {
        collection,
        runTransaction: async (callback: any) => {
            for (let attempt = 0; attempt < 5; attempt++) {
                const readVersions = new Map<string, number>();
                const writes: Array<{ ref: any; data: any; create?: boolean }> =
                    [];
                const read = (ref: any) => {
                    readVersions.set(ref.path, versions.get(ref.path) || 0);
                    const data = records.get(ref.path);
                    const snapshot = data && structuredClone(data);
                    return {
                        id: ref.id,
                        exists: !!snapshot,
                        data: () => snapshot
                    };
                };
                const result = await callback({
                    get: async (ref: any) =>
                        ref.fields
                            ? {
                                  docs: [...records.keys()]
                                      .filter((path) =>
                                          path.startsWith(`${ref.path}/`)
                                      )
                                      .map((path) => read(reference(path)))
                              }
                            : read(ref),
                    create: (ref: any, data: any) =>
                        writes.push({ ref, data, create: true }),
                    set: (ref: any, data: any) => writes.push({ ref, data })
                });
                await beforeCommit();
                // Model optimistic retries, including a shared record that did not exist yet.
                if (
                    [...readVersions].some(
                        ([path, version]) =>
                            (versions.get(path) || 0) !== version
                    )
                )
                    continue;
                if (
                    writes.some(
                        ({ ref, create }) => create && records.has(ref.path)
                    )
                )
                    throw new Error("Already exists");
                for (const { ref, data } of writes)
                    write(ref.path, { ...records.get(ref.path), ...data });
                commits.push(writes.map(({ ref }) => ref.path));
                return result;
            }
            throw new Error("Transaction retries exhausted");
        }
    };
    return { db, records, versions, commits, beforeCommit, write };
});
vi.mock("firebase-admin/firestore", () => ({
    FieldValue: { serverTimestamp: () => "server time" },
    getFirestore: () => fixture.db
}));
const request = {
    projectUid: "project",
    filename: "copy.csd",
    value: "unsaved source",
    path: [] as string[],
    folders: [] as any[]
};
const project = { userUid: "owner", name: "Sketches", public: true };
beforeEach(() => {
    fixture.records.clear();
    fixture.versions.clear();
    fixture.commits.length = 0;
    fixture.beforeCommit.mockReset();
    fixture.write("projects/project", project);
});
it("lets only one concurrent save claim a filename, even in an empty project", async () => {
    const results = await Promise.allSettled([
        saveAsFile(fixture.db, "owner", request),
        saveAsFile(fixture.db, "owner", request)
    ]);
    expect(
        results.filter((result) => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(
        results.find((result) => result.status === "rejected")
    ).toMatchObject({ reason: { code: "already-exists" } });
    expect(fixture.commits).toHaveLength(1);
});
it("serializes new folder names even when the callers use different folder IDs", async () => {
    const save = (id: string) =>
        saveAsFile(fixture.db, "owner", {
            ...request,
            path: [id],
            folders: [
                { id, name: "takes", type: "folder", path: [], pending: true }
            ]
        });
    const results = await Promise.allSettled([save("one"), save("two")]);
    expect(
        results.filter((result) => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(fixture.commits[0]).toHaveLength(3);
});
it("rechecks renames on transaction retry", async () => {
    fixture.write("projects/project/files/existing", {
        type: "txt",
        name: "other.csd",
        path: []
    });
    fixture.beforeCommit.mockImplementationOnce(() =>
        fixture.write("projects/project/files/existing", {
            type: "txt",
            name: "copy.csd",
            path: []
        })
    );
    await expect(
        saveAsFile(fixture.db, "owner", request)
    ).rejects.toMatchObject({ code: "already-exists" });
    expect(fixture.commits).toHaveLength(0);
});
it.each(["rename", "delete"])(
    "allows reuse after a %s without stale reservations",
    async (operation) => {
        const saved = await saveAsFile(fixture.db, "owner", request);
        const path = `projects/project/files/${saved.documentUid}`;
        fixture.write(
            path,
            operation === "rename"
                ? { ...fixture.records.get(path), name: "renamed.csd" }
                : undefined
        );
        const copy = await saveAsFile(fixture.db, "owner", request);
        expect(copy.documentUid).not.toBe(saved.documentUid);
    }
);
it.each(["delete", "move"])(
    "rejects a destination folder %s during a save",
    async (operation) => {
        const folder = { name: "Voices", type: "folder", path: [] };
        fixture.write("projects/project/files/voices", folder);
        fixture.beforeCommit.mockImplementationOnce(() =>
            fixture.write(
                "projects/project/files/voices",
                operation === "move"
                    ? { ...folder, path: ["parent"] }
                    : undefined
            )
        );
        await expect(
            saveAsFile(fixture.db, "owner", { ...request, path: ["voices"] })
        ).rejects.toMatchObject({ code: "failed-precondition" });
        expect(fixture.commits).toHaveLength(0);
    }
);
it("rechecks ownership on retry", async () => {
    fixture.beforeCommit.mockImplementationOnce(() =>
        fixture.write("projects/project", { ...project, userUid: "other" })
    );
    await expect(
        saveAsFile(fixture.db, "owner", request)
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(fixture.commits).toHaveLength(0);
});
it.each([undefined, "visitor"])("rejects saves by %s", async (uid) => {
    await expect(saveAsFile(fixture.db, uid, request)).rejects.toHaveProperty(
        "code",
        uid ? "permission-denied" : "unauthenticated"
    );
    expect(fixture.commits).toHaveLength(0);
});
it("copies text and only the chosen parent folders, leaving the source intact", async () => {
    fixture.write("projects/project/files/original", {
        name: "original.csd",
        type: "txt",
        value: "old",
        path: []
    });
    const result = await saveAsFile(fixture.db, "owner", {
        ...request,
        path: ["takes", "bass"],
        folders: [
            {
                id: "takes",
                name: "takes",
                type: "folder",
                pending: true,
                path: []
            },
            {
                id: "bass",
                name: "bass",
                type: "folder",
                pending: true,
                path: ["takes"]
            },
            {
                id: "unused",
                name: "unused",
                type: "folder",
                pending: true,
                path: []
            }
        ]
    });
    expect(result.entries).toHaveLength(3);
    expect(fixture.commits[0]).toHaveLength(4);
    expect(
        fixture.records.get(`projects/project/files/${result.documentUid}`)
    ).toMatchObject({
        value: "unsaved source",
        path: ["takes", "bass"],
        userUid: "owner"
    });
    expect(fixture.records.get("projects/project/files/original")?.value).toBe(
        "old"
    );
    expect(fixture.records.has("projects/project/files/unused")).toBe(false);
});
it("permits the same name in distinct folders", async () => {
    fixture.write("projects/project/files/voices", {
        name: "voices",
        type: "folder",
        path: []
    });
    await saveAsFile(fixture.db, "owner", request);
    await saveAsFile(fixture.db, "owner", { ...request, path: ["voices"] });
    expect(fixture.commits).toHaveLength(2);
});
it.each([
    { filename: ".." },
    { filename: "a\n" },
    { projectUid: "project/files" },
    { value: null },
    { value: "x".repeat(1_000_001) },
    { path: ["one", "one"] },
    {
        folders: [
            {
                id: "bad/id",
                name: "Bad",
                type: "folder",
                path: [],
                pending: true
            }
        ]
    }
])("validates callable input before writing", async (change) => {
    await expect(
        saveAsFile(fixture.db, "owner", { ...request, ...change })
    ).rejects.toHaveProperty("code", "invalid-argument");
    expect(fixture.commits).toHaveLength(0);
});
