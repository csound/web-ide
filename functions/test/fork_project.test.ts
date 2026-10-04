// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { forkProject } from "../src/fork_project";
import { publicProjectSummary } from "../src/public_project_summaries";
import { addProjectFileOnStorageUploadCallback } from "../src/add_project_file_on_storage_upload";

const fixture = vi.hoisted(() => {
    const records = new Map<string, Record<string, any>>();
    const objects = new Map<
        string,
        { size: number; generation: string; bytes: string }
    >();
    const copy = vi.fn();
    const deleted = vi.fn();
    const timestamp = "server time";
    let nextId = 0;
    const reference = (path: string): any => ({
        path,
        id: path.split("/").at(-1),
        get: async () => read(reference(path)),
        collection: (name: string) => collection(`${path}/${name}`)
    });
    const collection = (path: string, limit = Infinity): any => ({
        path,
        limitCount: limit,
        doc: (id = `fork-${++nextId}`) => reference(`${path}/${id}`),
        limit: (value: number) => collection(path, value)
    });
    const read = (ref: any) => {
        if (ref.limitCount !== undefined) {
            const docs = [...records.entries()]
                .filter(([key]) => key.startsWith(`${ref.path}/`))
                .slice(0, ref.limitCount)
                .map(([key]) => read(reference(key)));
            return { docs, size: docs.length };
        }
        const data = records.get(ref.path);
        return {
            id: ref.id,
            ref,
            exists: !!data,
            data: () => data && { ...data }
        };
    };
    const db = {
        collection,
        runTransaction: vi.fn(async (fn: any) => {
            const writes: (() => void)[] = [];
            const result = await fn({
                get: async (ref: any) => read(ref),
                create: (ref: any, data: any) =>
                    writes.push(() => records.set(ref.path, data)),
                set: (ref: any, data: any) =>
                    writes.push(() =>
                        records.set(ref.path, {
                            ...records.get(ref.path),
                            ...data
                        })
                    )
            });
            writes.forEach((write) => write());
            return result;
        })
    };
    const file = (path: string, options?: any): any => ({
        name: path,
        getMetadata: async () => {
            const object = objects.get(path);
            if (!object) throw new Error("No such object");
            return [object];
        },
        copy: async (destination: any, metadata: any) => {
            await copy(path, destination.name, metadata, options);
            objects.set(destination.name, { ...objects.get(path)! });
        },
        delete: async () => {
            deleted(path);
            objects.delete(path);
        }
    });
    return { records, objects, db, file, copy, deleted, timestamp };
});
vi.mock("firebase-admin", () => ({
    default: {
        firestore: Object.assign(() => fixture.db, {
            FieldValue: { serverTimestamp: () => fixture.timestamp }
        }),
        storage: () => ({ bucket: () => ({ file: fixture.file }) })
    }
}));
vi.mock("firebase-admin/firestore", () => ({
    FieldValue: { serverTimestamp: () => fixture.timestamp }
}));
vi.mock("firebase-functions/v2/https", async (original) => ({
    ...(await original<typeof import("firebase-functions/v2/https")>()),
    onCall: (_options: unknown, handler: unknown) => handler
}));
vi.mock("firebase-functions/logger", () => ({ error: vi.fn(), log: vi.fn() }));
vi.mock("firebase-functions/v2/storage", () => ({
    onObjectFinalized: (handler: unknown) => handler
}));
vi.mock("../src/public_requests", () => ({
    createRequestLimiter: () => () => {}
}));

const details = {
    sourceProjectUid: "source",
    name: "My sound",
    description: "A slower version",
    iconName: "default",
    iconForegroundColor: "#fff",
    iconBackgroundColor: "#336699",
    public: false,
    tags: ["ambient"]
};
const fork = (data: any = details, uid: string | undefined = "reader") =>
    (forkProject as any)({ data, auth: uid ? { uid } : undefined });

beforeEach(() => {
    vi.clearAllMocks();
    fixture.copy.mockReset();
    fixture.records.clear();
    fixture.objects.clear();
    fixture.records.set("projects/source", {
        name: "Original",
        userUid: "author",
        public: true,
        starCount: 42,
        forkedFrom: "ancestor"
    });
    fixture.records.set("projects/source/files/folder", {
        name: "sounds",
        type: "folder",
        userUid: "author"
    });
    fixture.records.set("projects/source/files/code", {
        name: "project.csd",
        type: "txt",
        value: "instr 1\nendin",
        userUid: "author"
    });
    fixture.records.set("projects/source/files/audio", {
        name: "tone.wav",
        type: "bin",
        path: ["folder"],
        userUid: "author"
    });
    fixture.records.set("targets/source", {
        targets: {
            main: {
                targetDocumentUid: "code",
                csoundOptions: { "-odac": true }
            },
            playlist: { playlistDocumentsUid: ["code"] }
        },
        defaultTarget: "main"
    });
    fixture.objects.set("author/source/audio", {
        size: 12,
        generation: "7",
        bytes: "sound"
    });
});

describe("fork project", () => {
    it("includes ancestry in public cards without a stale source name", () => {
        expect(
            publicProjectSummary("fork", {
                public: true,
                forkedFrom: "source",
                forkedAt: fixture.timestamp,
                sourceName: "Old name"
            })
        ).toMatchObject({ forkedFrom: "source", forkedAt: fixture.timestamp });
        expect(
            publicProjectSummary("fork", { sourceName: "Old name" })
        ).not.toHaveProperty("sourceName");
    });
    it("copies saved content, folders, targets, and binaries to the caller's project with direct ancestry", async () => {
        const { projectUid } = await fork();
        expect(fixture.records.get(`projects/${projectUid}`)).toEqual({
            name: details.name,
            description: details.description,
            iconName: details.iconName,
            iconForegroundColor: details.iconForegroundColor,
            iconBackgroundColor: details.iconBackgroundColor,
            public: false,
            userUid: "reader",
            starCount: 0,
            created: fixture.timestamp,
            forkedAt: fixture.timestamp,
            forkedFrom: "source"
        });
        expect(
            fixture.records.get(`projects/${projectUid}/files/code`)
        ).toMatchObject({ value: "instr 1\nendin", userUid: "reader" });
        expect(
            fixture.records.get(`projects/${projectUid}/files/audio`)
        ).toMatchObject({ path: ["folder"], userUid: "reader", type: "bin" });
        expect(
            fixture.records.get(`projects/${projectUid}/files/folder`)
        ).toMatchObject({ name: "sounds", type: "folder" });
        expect(fixture.records.get(`targets/${projectUid}`)).toEqual(
            fixture.records.get("targets/source")
        );
        expect(fixture.records.get("tags/ambient")).toEqual({
            [projectUid]: "reader"
        });
        expect(fixture.copy).toHaveBeenCalledWith(
            "author/source/audio",
            `reader/${projectUid}/audio`,
            {
                metadata: {
                    userUid: "reader",
                    projectUid,
                    docUid: "audio",
                    filename: "tone.wav",
                    forkCopy: "true",
                    firebaseStorageDownloadTokens: expect.any(String)
                },
                preconditionOpts: { ifGenerationMatch: 0 }
            },
            { generation: "7" }
        );
        fixture.records.delete("projects/source");
        fixture.objects.delete("author/source/audio");
        expect(fixture.objects.get(`reader/${projectUid}/audio`)?.bytes).toBe(
            "sound"
        );
    });
    it("rejects anonymous and hidden-source requests before reading any files", async () => {
        await expect(
            (forkProject as any)({ data: details })
        ).rejects.toMatchObject({ code: "unauthenticated" });
        expect(fixture.db.runTransaction).not.toHaveBeenCalled();
        fixture.records.get("projects/source")!.public = false;
        await expect(fork()).rejects.toMatchObject({
            code: "permission-denied"
        });
        expect(fixture.copy).not.toHaveBeenCalled();
    });
    it("leaves fork file records to the transaction when the storage event arrives", async () => {
        await fork();
        await (addProjectFileOnStorageUploadCallback as any)({
            data: { metadata: fixture.copy.mock.calls[0][2].metadata }
        });
        expect(fixture.db.runTransaction).toHaveBeenCalledTimes(2);
    });
    it("keeps a completed copy when the commit succeeds but its response is lost", async () => {
        const transaction = fixture.db.runTransaction.getMockImplementation()!;
        fixture.db.runTransaction
            .mockImplementationOnce(transaction)
            .mockImplementationOnce(async (callback) => {
                await transaction(callback);
                throw new Error("Lost commit response");
            });
        const { projectUid } = await fork();
        expect(fixture.records.has(`projects/${projectUid}`)).toBe(true);
        expect(fixture.objects.has(`reader/${projectUid}/audio`)).toBe(true);
        expect(fixture.deleted).not.toHaveBeenCalled();
    });
    it("lets owners fork a private project with their chosen visibility", async () => {
        fixture.records.get("projects/source")!.public = false;
        const { projectUid } = await fork(
            { ...details, public: true },
            "author"
        );
        expect(fixture.records.get(`projects/${projectUid}`)?.public).toBe(
            true
        );
    });
    it.each(["hidden", "deleted"])(
        "cleans up if the source becomes %s during the copy",
        async (change) => {
            fixture.copy.mockImplementationOnce(() => {
                if (change === "hidden")
                    fixture.records.get("projects/source")!.public = false;
                else fixture.records.delete("projects/source");
            });
            await expect(fork()).rejects.toMatchObject({
                code: "permission-denied"
            });
            expect(fixture.deleted).toHaveBeenCalledTimes(1);
            expect(
                [...fixture.records.keys()].some((key) =>
                    key.startsWith("projects/fork-")
                )
            ).toBe(false);
            expect([...fixture.objects.keys()]).toEqual([
                "author/source/audio"
            ]);
        }
    );
    it("removes copied binaries and creates no partial project when a later copy fails", async () => {
        fixture.records.set("projects/source/files/missing", {
            name: "missing.wav",
            type: "bin"
        });
        await expect(fork()).rejects.toMatchObject({ code: "internal" });
        expect(fixture.deleted).toHaveBeenCalledTimes(1);
        expect(
            [...fixture.records.keys()].some((key) =>
                key.startsWith("projects/fork-")
            )
        ).toBe(false);
    });
    it("does not follow a file's forged owner into someone else's storage", async () => {
        fixture.records.get("projects/source/files/audio")!.userUid = "victim";
        await fork();
        expect(fixture.copy.mock.calls[0][0]).toBe("author/source/audio");
    });
    it.each([
        { sourceProjectUid: "../source" },
        { name: " " },
        { public: "true" },
        { iconForegroundColor: "red" },
        { tags: ["bad/tag"] }
    ])("rejects invalid details before copying: %j", async (invalid) => {
        await expect(fork({ ...details, ...invalid })).rejects.toMatchObject({
            code: "invalid-argument"
        });
        expect(fixture.copy).not.toHaveBeenCalled();
    });
    it("bounds binary copy size without leaving a project", async () => {
        fixture.objects.get("author/source/audio")!.size = 101 * 1024 * 1024;
        await expect(fork()).rejects.toMatchObject({
            code: "resource-exhausted"
        });
        expect(fixture.copy).not.toHaveBeenCalled();
    });
    it("bounds file count before copying", async () => {
        for (let i = 0; i < 401; i++)
            fixture.records.set(`projects/source/files/file${i}`, {
                name: `${i}.txt`,
                type: "txt"
            });
        await expect(fork()).rejects.toMatchObject({
            code: "resource-exhausted"
        });
        expect(fixture.copy).not.toHaveBeenCalled();
    });
});
