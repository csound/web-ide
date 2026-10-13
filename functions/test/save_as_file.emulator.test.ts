// @vitest-environment node
import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it
} from "vitest";
import { deleteApp, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { saveAsFile } from "../src/save_as_file";

// Opt in with FIRESTORE_EMULATOR_HOST=127.0.0.1:<port>. Never contact a real database.
const localEmulator = /^127\.0\.0\.1:\d+$/u.test(
    process.env.FIRESTORE_EMULATOR_HOST || ""
);
describe.skipIf(!localEmulator)("Save As with Firestore transactions", () => {
    let app: App;
    let database: Firestore;
    let projectUid: string;
    const request = () => ({
        projectUid,
        filename: "copy.csd",
        value: "edited text",
        path: [],
        folders: []
    });
    beforeAll(() => {
        app = initializeApp(
            { projectId: "demo-save-as" },
            `save-as-${randomUUID()}`
        );
        database = getFirestore(app);
    });
    beforeEach(async () => {
        projectUid = randomUUID();
        await database
            .collection("projects")
            .doc(projectUid)
            .set({ userUid: "owner", name: "Study", public: false });
    });
    afterEach(async () => {
        await database.recursiveDelete(
            database.collection("projects").doc(projectUid)
        );
        await database
            .collection("projectLastModified")
            .doc(projectUid)
            .delete();
    });
    afterAll(async () => {
        await database.terminate();
        await deleteApp(app);
    });
    it("allows exactly one concurrent Save As in an empty project", async () => {
        const results = await Promise.allSettled(
            Array.from({ length: 3 }, () =>
                saveAsFile(database, "owner", request())
            )
        );
        expect(
            results.filter((result) => result.status === "fulfilled")
        ).toHaveLength(1);
        expect(
            results.filter((result) => result.status === "rejected")
        ).toEqual([
            expect.objectContaining({
                reason: expect.objectContaining({ code: "already-exists" })
            }),
            expect.objectContaining({
                reason: expect.objectContaining({ code: "already-exists" })
            })
        ]);
        const files = await database
            .collection("projects")
            .doc(projectUid)
            .collection("files")
            .get();
        expect(files.size).toBe(1);
        expect(files.docs[0].data().value).toBe("edited text");
    }, 30_000);
    it("does not create duplicate parent folders with different IDs", async () => {
        const save = (id: string) =>
            saveAsFile(database, "owner", {
                ...request(),
                path: [id],
                folders: [
                    {
                        id,
                        name: "takes",
                        type: "folder",
                        path: [],
                        pending: true
                    }
                ]
            });
        const results = await Promise.allSettled([
            save("first"),
            save("second")
        ]);
        expect(
            results.filter((result) => result.status === "fulfilled")
        ).toHaveLength(1);
        const files = await database
            .collection("projects")
            .doc(projectUid)
            .collection("files")
            .get();
        expect(files.size).toBe(2);
        expect(
            files.docs.filter((file) => file.data().name === "takes")
        ).toHaveLength(1);
    }, 30_000);
    it("uses current names after rename, move and delete", async () => {
        const files = database
            .collection("projects")
            .doc(projectUid)
            .collection("files");
        const first = await saveAsFile(database, "owner", request());
        await files.doc(first.documentUid).update({ name: "renamed.csd" });
        const second = await saveAsFile(database, "owner", request());
        await files.doc(second.documentUid).delete();
        await saveAsFile(database, "owner", request());
        await expect(
            saveAsFile(database, "owner", request())
        ).rejects.toHaveProperty("code", "already-exists");
        await files
            .doc("voices")
            .set({ type: "folder", name: "voices", path: [] });
        await saveAsFile(database, "owner", { ...request(), path: ["voices"] });
        await files.doc("voices").update({ path: ["moved"] });
        await expect(
            saveAsFile(database, "owner", {
                ...request(),
                path: ["voices"],
                filename: "next.csd"
            })
        ).rejects.toHaveProperty("code", "failed-precondition");
    }, 30_000);
});
