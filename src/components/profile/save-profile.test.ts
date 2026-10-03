import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveProfile } from "./save-profile";

const mocks = vi.hoisted(() => ({
    records: new Map<string, Record<string, unknown>>(),
    set: vi.fn(),
    remove: vi.fn()
}));
vi.mock("../../config/firestore", () => ({
    database: {},
    profiles: "profiles",
    usernames: "usernames"
}));
vi.mock("firebase/firestore", () => ({
    doc: (collection: string, id: string) => `${collection}/${id}`,
    runTransaction: async (
        _database: unknown,
        callback: (transaction: unknown) => Promise<void>
    ) =>
        callback({
            get: async (path: string) => ({
                exists: () => mocks.records.has(path),
                data: () => mocks.records.get(path)
            }),
            set: mocks.set,
            delete: mocks.remove
        })
}));

beforeEach(() => {
    vi.clearAllMocks();
    mocks.records.clear();
});

describe("saving a profile username", () => {
    it.each(["", " ", "bad/name"])(
        "rejects %j before writing",
        async (username) => {
            await expect(saveProfile("uid123", username, {})).rejects.toThrow();
            expect(mocks.set).not.toHaveBeenCalled();
        }
    );

    it("checks ownership at save time even if an earlier availability check passed", async () => {
        mocks.records.set("usernames/chosen", { userUid: "anotherUser" });
        await expect(saveProfile("uid123", "chosen", {})).rejects.toThrow(
            "already taken"
        );
        expect(mocks.set).not.toHaveBeenCalled();
        expect(mocks.remove).not.toHaveBeenCalled();
    });

    it("keeps the fallback alias when a user chooses a name", async () => {
        mocks.records.set("profiles/uid123", { username: "uid123" });
        mocks.records.set("usernames/uid123", { userUid: "uid123" });
        await saveProfile("uid123", "chosen", { bio: "My bio" });
        expect(mocks.set).toHaveBeenCalledWith("usernames/chosen", {
            userUid: "uid123"
        });
        expect(mocks.set).toHaveBeenCalledWith(
            "profiles/uid123",
            { bio: "My bio", username: "chosen", userUid: "uid123" },
            { merge: true }
        );
        expect(mocks.remove).not.toHaveBeenCalled();
    });

    it("removes an old chosen name only when this user owns it", async () => {
        mocks.records.set("profiles/uid123", { username: "oldName" });
        mocks.records.set("usernames/oldName", { userUid: "uid123" });
        await saveProfile("uid123", "chosen", {});
        expect(mocks.remove).toHaveBeenCalledWith("usernames/oldName");
    });
});
