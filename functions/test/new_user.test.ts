// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { newUserCallback } from "../src/new_user";
import { ensureProfileUsername } from "../src/profile_username";

const { records, database } = vi.hoisted(() => {
    const records = new Map<string, Record<string, unknown>>();
    const reference = (path: string) => ({
        path,
        id: path.split("/").at(-1),
        set: async (value: Record<string, unknown>) => records.set(path, value)
    });
    const snapshot = (ref: ReturnType<typeof reference>) => ({
        ref,
        id: ref.id,
        exists: records.has(ref.path),
        data: () => records.get(ref.path)
    });
    const database = {
        collection: (name: string) => ({
            doc: (id: string) => reference(`${name}/${id}`),
            where: (field: string, _operator: string, value: string) => ({
                collection: name,
                field,
                value
            })
        }),
        runTransaction: async (callback: (tx: any) => Promise<unknown>) => {
            const writes: Array<() => void> = [];
            const result = await callback({
                get: async (ref: any) => {
                    if (writes.length) throw new Error("Read after write");
                    if (ref.collection) {
                        return {
                            docs: [...records.entries()]
                                .filter(
                                    ([path, data]) =>
                                        path.startsWith(`${ref.collection}/`) &&
                                        data[ref.field] === ref.value
                                )
                                .map(([path]) => snapshot(reference(path)))
                        };
                    }
                    return snapshot(ref);
                },
                set: (
                    ref: any,
                    value: Record<string, unknown>,
                    options?: { merge: boolean }
                ) => {
                    writes.push(() =>
                        records.set(
                            ref.path,
                            options?.merge
                                ? { ...records.get(ref.path), ...value }
                                : value
                        )
                    );
                }
            });
            writes.forEach((write) => write());
            return result;
        }
    };
    return { records, database };
});

vi.mock("firebase-admin", () => ({ default: { firestore: () => database } }));
vi.mock("firebase-functions/v1", () => ({
    default: {
        runWith: () => ({
            auth: {
                user: () => ({ onCreate: (callback: unknown) => callback })
            }
        })
    }
}));

const user = { uid: "author123", displayName: "An author", photoURL: null };
const createUser = () =>
    (newUserCallback as unknown as (user: typeof user) => Promise<unknown>)(
        user
    );

beforeEach(() => records.clear());

describe("new user profiles", () => {
    it("creates a usable username and lookup before signup is finished", async () => {
        await createUser();
        expect(records.get("profiles/author123")?.username).toBe(user.uid);
        expect(records.get("usernames/author123")).toEqual({
            userUid: user.uid
        });
    });

    it("preserves a profile completed before the auth trigger runs", async () => {
        const profile = {
            username: "chosenName",
            displayName: "Chosen name",
            bio: "My bio"
        };
        records.set("profiles/author123", profile);
        records.set("usernames/chosenName", { userUid: user.uid });
        records.set("projectsCount/author123", { all: 3, public: 2 });
        await createUser();
        await createUser();
        expect(records.get("profiles/author123")).toMatchObject(profile);
        expect(records.get("projectsCount/author123")).toEqual({
            all: 3,
            public: 2
        });
        expect(records.has("usernames/author123")).toBe(false);
    });

    it("restores a registered name when the profile username is blank", async () => {
        records.set("profiles/author123", { username: "", bio: "Keep this" });
        records.set("usernames/chosenName", { userUid: user.uid });
        await createUser();
        expect(records.get("profiles/author123")).toMatchObject({
            username: "chosenName",
            bio: "Keep this"
        });
    });

    it("does not take a fallback name owned by someone else", async () => {
        records.set("usernames/author123", { userUid: "someoneElse" });
        await expect(createUser()).rejects.toThrow();
        expect(records.get("usernames/author123")).toEqual({
            userUid: "someoneElse"
        });
        expect(records.has("profiles/author123")).toBe(false);
    });
});

describe("repairing existing profiles", () => {
    it("repairs the lookup without changing a chosen username or profile fields", async () => {
        const profile = {
            username: "chosen",
            bio: "Keep this",
            userUid: user.uid
        };
        records.set("profiles/author123", profile);
        const result = await ensureProfileUsername(database as never, user.uid);
        expect(result.createdMapping).toBe(true);
        expect(records.get("profiles/author123")).toEqual(profile);
        expect(records.get("usernames/chosen")).toEqual({ userUid: user.uid });
        const again = await ensureProfileUsername(database as never, user.uid);
        expect(again.changed).toBe(false);
    });

    it("does not recreate a profile deleted after the audit", async () => {
        await expect(
            ensureProfileUsername(database as never, user.uid)
        ).rejects.toThrow("no longer exists");
        expect(records.size).toBe(0);
    });

    it("leaves ambiguous registered names for review", async () => {
        records.set("profiles/author123", { username: "" });
        records.set("usernames/first", { userUid: user.uid });
        records.set("usernames/second", { userUid: user.uid });
        await expect(
            ensureProfileUsername(database as never, user.uid)
        ).rejects.toThrow("Multiple registered names");
        expect(records.get("profiles/author123")?.username).toBe("");
    });
});
