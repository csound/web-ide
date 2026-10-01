import type { Firestore } from "firebase-admin/firestore";

export const hasUsername = (value: unknown): value is string =>
    typeof value === "string" &&
    value.trim().length > 0 &&
    !value.includes("/");

// Used by account creation and the repair script. Transactions preserve a
// username chosen while the auth trigger or repair is running.
export async function ensureProfileUsername(
    database: Firestore,
    uid: string,
    defaults?: Record<string, unknown>
) {
    return database.runTransaction(async (transaction) => {
        const profileRef = database.collection("profiles").doc(uid);
        const profile = await transaction.get(profileRef);
        if (!profile.exists && !defaults) {
            throw new Error(`Profile no longer exists: ${uid}`);
        }
        const data = profile.data() ?? {};
        let username = data.username;
        if (!hasUsername(username)) {
            const names = await transaction.get(
                database.collection("usernames").where("userUid", "==", uid)
            );
            if (names.docs.length > 1) {
                throw new Error(
                    `Multiple registered names for ${uid}; review required`
                );
            }
            username = names.docs[0]?.id ?? uid;
        }
        if (!hasUsername(username))
            throw new Error(`Invalid username for ${uid}`);
        const nameRef = database.collection("usernames").doc(username);
        const name = await transaction.get(nameRef);
        if (name.exists && name.data()?.userUid !== uid) {
            throw new Error(`Username conflict for ${uid}; review required`);
        }
        const countRef = database.collection("projectsCount").doc(uid);
        const count = defaults ? await transaction.get(countRef) : undefined;
        const changed = data.username !== username || !name.exists;

        if (defaults) {
            transaction.set(
                profileRef,
                {
                    ...defaults,
                    ...data,
                    userUid: uid,
                    username
                },
                { merge: true }
            );
        } else if (data.username !== username) {
            transaction.set(profileRef, { username }, { merge: true });
        }
        if (!name.exists) transaction.set(nameRef, { userUid: uid });
        if (count && !count.exists)
            transaction.set(countRef, { all: 0, public: 0 });
        return {
            uid,
            username,
            previousUsername: data.username ?? null,
            createdMapping: !name.exists,
            changed
        };
    });
}
