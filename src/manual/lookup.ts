let lookup: Promise<Record<string, unknown>> | undefined;

/** Load the shipped index only when an editor needs an opcode article. */
export async function findManualEntry(
    token: string
): Promise<string | undefined> {
    try {
        lookup ??= fetch("/manual/lookup.json")
            .then(async (response) => {
                if (!response.ok) throw new Error("Manual index unavailable");
                return response.json();
            })
            .catch((error) => {
                lookup = undefined;
                throw error;
            });
        const entries = await lookup;
        const path = Object.hasOwn(entries, token) ? entries[token] : undefined;
        if (typeof path !== "string") return;
        const url = new URL(path, new URL("/manual/", location.origin));
        if (
            url.origin === location.origin &&
            url.pathname.startsWith("/manual/")
        ) {
            return url.pathname + url.search + url.hash;
        }
    } catch {
        // A failed lookup must not hide the signature or disrupt editing.
    }
}
