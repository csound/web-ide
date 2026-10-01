import { doc, runTransaction } from "firebase/firestore";
import { database, profiles, usernames } from "@config/firestore";

export const isValidUsername = (username: string): boolean =>
    /^[\w-]{1,49}$/.test(username);

export async function saveProfile(
    userUid: string,
    username: string,
    fields: Record<string, unknown>
): Promise<void> {
    if (!isValidUsername(username)) {
        throw new Error(
            "Use 1–49 letters, numbers, underscores or hyphens for your username."
        );
    }
    await runTransaction(database, async (transaction) => {
        const profileRef = doc(profiles, userUid);
        const nameRef = doc(usernames, username);
        const profile = await transaction.get(profileRef);
        const name = await transaction.get(nameRef);
        if (name.exists() && name.data().userUid !== userUid) {
            throw new Error("That username is already taken.");
        }
        const oldUsername = profile.data()?.username;
        // Keep the UID alias so links shared before choosing a name still work.
        const oldNameRef =
            typeof oldUsername === "string" &&
            oldUsername.trim() &&
            oldUsername !== username &&
            oldUsername !== userUid
                ? doc(usernames, oldUsername)
                : undefined;
        const oldName = oldNameRef
            ? await transaction.get(oldNameRef)
            : undefined;
        transaction.set(nameRef, { userUid });
        transaction.set(
            profileRef,
            { ...fields, userUid, username },
            { merge: true }
        );
        if (oldNameRef && oldName?.data()?.userUid === userUid) {
            transaction.delete(oldNameRef);
        }
    });
}
