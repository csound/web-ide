import { expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import {
    projectCreatedDate,
    projectDateMillis,
    projectLastEdited
} from "./dates";

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

it("shows today or a creation date with a month name and no time", () => {
    const now = new Date(2026, 9, 4, 12).getTime();
    expect(projectCreatedDate(new Date(2026, 9, 4, 0).getTime(), now)).toBe(
        "today"
    );
    expect(
        projectCreatedDate(new Date(2026, 9, 3, 23, 59).getTime(), now)
    ).toBe("3 October 2026");
    expect(projectCreatedDate(new Date(2024, 1, 29).getTime(), now)).toBe(
        "29 February 2024"
    );
});

it.each([
    [new Date(2026, 9, 4, 0), "today"],
    [new Date(2026, 9, 4, 23), "today"],
    [new Date(2026, 9, 3, 23, 59), "yesterday"],
    [new Date(2026, 9, 2), "2 days ago"],
    [new Date(2026, 8, 28), "6 days ago"],
    [new Date(2026, 8, 27), "last week"],
    [new Date(2026, 8, 21), "last week"],
    [new Date(2026, 8, 20), "2 weeks ago"],
    [new Date(2026, 8, 6), "4 weeks ago"],
    [new Date(2026, 8, 4, 23), "last month"],
    [new Date(2026, 7, 4), "2 months ago"],
    [new Date(2025, 9, 4, 23), "last year"],
    [new Date(2024, 9, 4), "2 years ago"]
])("formats the last edit on %s as %s", (edited, expected) => {
    expect(
        projectLastEdited(edited.getTime(), new Date(2026, 9, 4, 12).getTime())
    ).toBe(expected);
});

it.each([
    // Includes US and European daylight saving changes in both directions.
    [new Date(2026, 2, 8), new Date(2026, 2, 9)],
    [new Date(2026, 2, 29), new Date(2026, 2, 30)],
    [new Date(2026, 9, 25), new Date(2026, 9, 26)],
    [new Date(2026, 10, 1), new Date(2026, 10, 2)],
    [new Date(2025, 11, 31, 23, 59), new Date(2026, 0, 1)]
])("uses calendar days across %s to %s", (edited, now) => {
    expect(projectLastEdited(edited.getTime(), now.getTime())).toBe(
        "yesterday"
    );
});

it("counts full months across short months and leap years", () => {
    expect(
        projectLastEdited(
            new Date(2026, 0, 31).getTime(),
            new Date(2026, 1, 28).getTime()
        )
    ).toBe("last month");
    expect(
        projectLastEdited(
            new Date(2024, 1, 29).getTime(),
            new Date(2025, 2, 1).getTime()
        )
    ).toBe("last year");
});
