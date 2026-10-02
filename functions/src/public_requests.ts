import { HttpsError } from "firebase-functions/v2/https";

export const publicCallableOptions = {
    cors: true,
    maxInstances: 3,
    concurrency: 20
} as const;

/** Allow a burst of 30 requests, then one per second per instance. */
export function createRequestLimiter() {
    let tokens = 30;
    let lastRefill = Date.now();
    return () => {
        const now = Date.now();
        tokens = Math.min(30, tokens + Math.max(0, now - lastRefill) / 1000);
        lastRefill = now;
        if (tokens < 1) {
            throw new HttpsError(
                "resource-exhausted",
                "Too many requests. Please try again shortly."
            );
        }
        tokens -= 1;
    };
}

/** Share one refresh across requests; cache empty results and briefly back off on failure. */
export function createReadCache<T>(load: () => Promise<T>) {
    let value: T;
    let expiresAt = 0;
    let pending: Promise<T> | undefined;
    let failure: unknown;
    let retryAt = 0;
    return async (): Promise<T> => {
        if (pending) return pending;
        if (Date.now() < expiresAt) return value;
        if (Date.now() < retryAt) throw failure;
        pending = load()
            .then(
                (result) => {
                    value = result;
                    expiresAt = Date.now() + 5 * 60 * 1000;
                    return result;
                },
                (error) => {
                    failure = error;
                    retryAt = Date.now() + 5000;
                    throw error;
                }
            )
            .finally(() => {
                pending = undefined;
            });
        return pending;
    };
}
