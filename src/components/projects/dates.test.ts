import { expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import { projectAge, projectDateMillis } from "./dates";

it("reads dates from Firestore, callable JSON, and local cached values", () => {
    const millis = Date.UTC(2024, 2, 18, 12, 30, 0, 123);
    const timestamp = Timestamp.fromMillis(millis);
    for (const value of [
        timestamp,
        millis,
        timestamp.toJSON(),
        {
            _seconds: timestamp.seconds,
            _nanoseconds: timestamp.nanoseconds
        }
    ])
        expect(projectDateMillis(value)).toBe(millis);
    expect(projectDateMillis(0)).toBe(0);
});

it("does not turn missing or invalid dates into a recent date", () => {
    for (const value of [
        undefined,
        null,
        "",
        "2024-03-18",
        {},
        NaN,
        Infinity,
        1e20,
        1e15,
        { _seconds: "123", _nanoseconds: 0 },
        { seconds: 1, nanoseconds: -1 }
    ]) {
        expect(projectDateMillis(value)).toBeUndefined();
    }
});

it.each([
    [0, "Just created"],
    [-1000, "Just created"],
    [60000, "1 minute ago"],
    [3 * 86400000, "3 days ago"],
    [7 * 86400000, "1 week ago"],
    [35 * 86400000, "1 month ago"],
    [400 * 86400000, "1 year ago"]
])("formats creation age after %s ms", (elapsed, expected) => {
    expect(projectAge(1_000_000_000_000, 1_000_000_000_000 + elapsed)).toBe(
        expected
    );
});
