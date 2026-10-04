import {
    differenceInCalendarDays,
    differenceInMonths,
    differenceInYears,
    startOfDay
} from "date-fns";

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

const creationDateFormat = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
});

export const projectFullCreatedDate = (created: number): string =>
    creationDateFormat.format(created);

export function projectCreatedDate(created: number, now = Date.now()): string {
    return differenceInCalendarDays(now, created) === 0
        ? "today"
        : projectFullCreatedDate(created);
}

/** Count local calendar days so midnight and daylight saving changes agree. */
export function projectLastEdited(edited: number, now = Date.now()): string {
    const today = startOfDay(now);
    const editDay = startOfDay(edited);
    const days = differenceInCalendarDays(today, editDay);
    // Treat clock skew as today rather than showing a negative age.
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    const years = differenceInYears(today, editDay);
    if (years >= 1) return years === 1 ? "last year" : `${years} years ago`;
    const months = differenceInMonths(today, editDay);
    if (months >= 1)
        return months === 1 ? "last month" : `${months} months ago`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "last week" : `${weeks} weeks ago`;
}
