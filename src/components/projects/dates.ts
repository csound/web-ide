/** Read Firestore timestamps, callable JSON timestamps, or epoch milliseconds. */
export function projectDateMillis(value: unknown): number | undefined {
    let millis: unknown = value;
    if (value && typeof value === "object") {
        if ("toMillis" in value && typeof value.toMillis === "function") {
            millis = value.toMillis();
        } else {
            const seconds =
                "seconds" in value
                    ? value.seconds
                    : "_seconds" in value
                      ? value._seconds
                      : undefined;
            const nanos =
                "nanoseconds" in value
                    ? value.nanoseconds
                    : "_nanoseconds" in value
                      ? value._nanoseconds
                      : 0;
            millis =
                typeof seconds === "number" &&
                typeof nanos === "number" &&
                nanos >= 0 &&
                nanos < 1e9
                    ? seconds * 1000 + nanos / 1e6
                    : undefined;
        }
    }
    // Firestore timestamps cover years 0001 through 9999.
    return typeof millis === "number" &&
        millis >= -62135596800000 &&
        millis < 253402300800000
        ? millis
        : undefined;
}
