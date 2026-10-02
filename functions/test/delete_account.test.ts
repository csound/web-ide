// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { deleteAccount } from "../src/delete_user";

const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    firestore: vi.fn(),
    getUser: vi.fn(),
    deleteUser: vi.fn(),
    deleteDocument: vi.fn()
}));
vi.mock("firebase-admin", () => ({ default: mocks }));
vi.mock("firebase-functions/logger", () => ({ log: vi.fn() }));
vi.mock("firebase-functions/v1", () => ({
    default: { auth: { user: () => ({ onDelete: vi.fn() }) } }
}));

beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
    mocks.auth.mockReturnValue({
        getUser: mocks.getUser,
        deleteUser: mocks.deleteUser
    });
    mocks.getUser.mockImplementation(async (uid) => ({ uid }));
    mocks.firestore.mockReturnValue({
        collection: () => ({
            doc: (uid: string) => ({ delete: () => mocks.deleteDocument(uid) }),
            where: () => ({ get: async () => ({ docs: [] }) })
        }),
        batch: () => ({ commit: vi.fn() })
    });
});
afterEach(() => vi.useRealTimers());

const remove = (auth?: unknown) =>
    deleteAccount.run({
        auth,
        data: { userUid: "another-fixture-user" }
    } as Parameters<typeof deleteAccount.run>[0]);

it("rejects anonymous deletion before any database or auth lookup", async () => {
    await expect(remove()).rejects.toMatchObject({ code: "unauthenticated" });
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.firestore).not.toHaveBeenCalled();
});

it.each([undefined, null, "123", NaN, Infinity, 0, -1])(
    "rejects invalid sign-in time %s before any deletion",
    async (authTime) => {
        await expect(
            remove({ uid: "fixture-user", token: { auth_time: authTime } })
        ).rejects.toMatchObject({
            code: "failed-precondition",
            details: { reason: "requires-recent-login" }
        });
        expect(mocks.auth).not.toHaveBeenCalled();
        expect(mocks.firestore).not.toHaveBeenCalled();
    }
);

it.each([-301, 61])(
    "rejects a stale or future sign-in time (%s seconds)",
    async (seconds) => {
        await expect(
            remove({
                uid: "fixture-user",
                token: { auth_time: Date.now() / 1000 + seconds }
            })
        ).rejects.toMatchObject({
            code: "failed-precondition"
        });
        expect(mocks.firestore).not.toHaveBeenCalled();
        expect(mocks.auth).not.toHaveBeenCalled();
    }
);

it("deletes only the recently authenticated caller, ignoring a supplied user ID", async () => {
    await expect(
        remove({
            uid: "fixture-user",
            token: { auth_time: Date.now() / 1000 - 60 }
        })
    ).resolves.toEqual({ success: true });
    expect(mocks.getUser).toHaveBeenCalledWith("fixture-user");
    expect(mocks.deleteUser).toHaveBeenCalledExactlyOnceWith("fixture-user");
    expect(mocks.deleteDocument.mock.calls.flat()).not.toContain(
        "another-fixture-user"
    );
});
