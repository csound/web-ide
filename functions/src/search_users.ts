import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import Fuse from "fuse.js";
import {
    createReadCache,
    createRequestLimiter,
    publicCallableOptions
} from "./public_requests.js";

interface SearchUsersParams {
    query: string;
    offset?: number;
    limit?: number;
}

const profileFields = [
    "username",
    "displayName",
    "bio",
    "link1",
    "link2",
    "link3",
    "photoUrl"
];
const validUsername = (name: unknown): name is string =>
    typeof name === "string" && /^[\w-]{1,49}$/.test(name);
const text = (value: unknown, max: number) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";
const publicUrl = (value: unknown, allowBareWebsite = false) => {
    try {
        const input = text(value, 2048);
        const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(input);
        const url = new URL(
            allowBareWebsite && input && !hasScheme ? `https://${input}` : input
        );
        return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch {
        return "";
    }
};

/** Only public profile fields belong in the index or the response. */
function userSummary(
    userUid: string,
    profile: FirebaseFirestore.DocumentData,
    fallbackUsername = ""
) {
    const username = validUsername(profile.username)
        ? profile.username
        : fallbackUsername;
    if (!validUsername(username)) return undefined;
    return {
        userUid,
        username,
        displayName: text(profile.displayName, 200),
        bio: text(profile.bio, 10000),
        links: [profile.link1, profile.link2, profile.link3]
            .map((value) => publicUrl(value, true))
            .filter(Boolean),
        photoUrl: publicUrl(profile.photoUrl)
    };
}
type UserSummary = NonNullable<ReturnType<typeof userSummary>>;
const searchOptions = {
    keys: [
        { name: "username", weight: 0.4 },
        { name: "displayName", weight: 0.3 },
        { name: "bio", weight: 0.2 },
        { name: "links", weight: 0.1 }
    ],
    threshold: 0.35,
    ignoreLocation: true,
    ignoreDiacritics: true,
    includeScore: true,
    minMatchCharLength: 2
};
const acceptRequest = createRequestLimiter();

// One full directory per instance every five minutes, shared across queries
// and concurrent requests. Never read the private users or Auth collections.
const loadIndex = createReadCache(async () => {
    const db = getFirestore();
    const profiles = await db
        .collection("profiles")
        .select(...profileFields)
        .get();
    const missingNames = profiles.docs
        .filter((profile) => !validUsername(profile.data().username))
        .map((profile) => profile.id);
    const aliases = new Map<string, string[]>();
    // Some older profiles only have their address in the usernames collection.
    for (let offset = 0; offset < missingNames.length; offset += 30) {
        const names = await db
            .collection("usernames")
            .where("userUid", "in", missingNames.slice(offset, offset + 30))
            .select("userUid")
            .get();
        for (const name of names.docs) {
            if (validUsername(name.id)) {
                const uid = name.data().userUid;
                aliases.set(uid, [...(aliases.get(uid) ?? []), name.id]);
            }
        }
    }
    const users: UserSummary[] = [];
    for (const profile of profiles.docs) {
        const names = aliases.get(profile.id) ?? [];
        const summary = userSummary(
            profile.id,
            profile.data(),
            names.length === 1 ? names[0] : ""
        );
        if (summary) users.push(summary);
    }
    return new Fuse(users, searchOptions);
});

export const searchUsers = onCall<SearchUsersParams>(
    publicCallableOptions,
    async ({ data }) => {
        const { query, offset = 0, limit = 8 } = data ?? {};
        const normalized =
            typeof query === "string" ? query.trim().replace(/^@/, "") : "";
        if (
            typeof query !== "string" ||
            query.length > 200 ||
            normalized.length < 2 ||
            !Number.isSafeInteger(offset) ||
            offset < 0 ||
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 20
        )
            throw new HttpsError(
                "invalid-argument",
                "Enter at least two characters and valid pagination."
            );
        acceptRequest();
        const matches = (await loadIndex()).search(normalized);
        const db = getFirestore();
        const users: UserSummary[] = [];
        let cursor = offset;
        let checked = 0;
        // Recheck only this page, with a fixed budget for deleted or changed
        // candidates. A continuation offset preserves access to later matches.
        while (cursor < matches.length && checked < 50) {
            const candidates = matches.slice(
                cursor,
                cursor + Math.min(limit + 1 - users.length, 50 - checked)
            );
            const profiles = await db.getAll(
                ...candidates.map(({ item }) =>
                    db.collection("profiles").doc(item.userUid)
                ),
                { fieldMask: profileFields }
            );
            const current = profiles.map((profile, index) =>
                profile.exists
                    ? userSummary(
                          profile.id,
                          profile.data()!,
                          candidates[index].item.username
                      )
                    : undefined
            );
            const names = [
                ...new Set(
                    current.flatMap((user) => (user ? [user.username] : []))
                )
            ];
            const addresses = names.length
                ? await db.getAll(
                      ...names.map((name) =>
                          db.collection("usernames").doc(name)
                      ),
                      { fieldMask: ["userUid"] }
                  )
                : [];
            const owners = new Map(
                addresses.map((name) => [name.id, name.data()?.userUid])
            );
            const liveMatches = new Set(
                new Fuse(
                    current.filter(
                        (user): user is UserSummary =>
                            !!user && owners.get(user.username) === user.userUid
                    ),
                    searchOptions
                )
                    .search(normalized)
                    .map(({ item }) => item.userUid)
            );
            for (const user of current) {
                if (user && liveMatches.has(user.userUid)) {
                    // Keep the look-ahead result for the next page.
                    if (users.length === limit)
                        return { data: users, nextOffset: cursor };
                    users.push(user);
                }
                cursor += 1;
                checked += 1;
            }
        }
        return {
            data: users,
            nextOffset: cursor < matches.length ? cursor : null
        };
    }
);
