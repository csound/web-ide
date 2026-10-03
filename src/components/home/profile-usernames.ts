import { getDocs, query, where } from "firebase/firestore";
import { usernames } from "@config/firestore";
import type { IProfile } from "@comp/profile/types";

/** Resolve existing profile addresses in memory; never repair database records. */
export async function resolveProfileUsernames(
    profiles: Record<string, IProfile>
) {
    const missing = Object.keys(profiles).filter(
        (uid) => !profiles[uid].username
    );
    const resolved = { ...profiles };
    try {
        for (let offset = 0; offset < missing.length; offset += 30) {
            const batch = missing.slice(offset, offset + 30);
            const names = await getDocs(
                query(usernames, where("userUid", "in", batch))
            );
            const aliases = new Map<string, string[]>();
            names.forEach((document) => {
                const uid = document.data().userUid;
                if (!batch.includes(uid)) return;
                aliases.set(uid, [...(aliases.get(uid) ?? []), document.id]);
            });
            for (const uid of batch) {
                const registered = aliases.get(uid) ?? [];
                if (registered.length === 1) {
                    resolved[uid] = {
                        ...profiles[uid],
                        username: registered[0]
                    };
                }
            }
        }
    } catch (error) {
        // A failed lookup must not hide the author's name or their projects.
        console.error(error);
    }
    return resolved;
}
