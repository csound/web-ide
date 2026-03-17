import { describe, expect, it } from "vitest";
import { deepMerge, formatFileSize, validateEmail } from "./utils";

describe("validateEmail", () => {
    it("accepts a valid email address", () => {
        expect(validateEmail("user@example.com")).toBe(true);
    });

    it("rejects an invalid email address", () => {
        expect(validateEmail("not-an-email")).toBe(false);
    });
});

describe("formatFileSize", () => {
    it("formats bytes below one kilobyte", () => {
        expect(formatFileSize(999)).toBe("999 B");
    });

    it("formats kilobytes and megabytes", () => {
        expect(formatFileSize(1_500)).toBe("1.50 KB");
        expect(formatFileSize(2_000_000)).toBe("2.00 MB");
    });
});

describe("deepMerge", () => {
    it("merges nested objects and deduplicates arrays", () => {
        expect(
            deepMerge(
                {
                    nested: { enabled: true },
                    values: ["a", "b"]
                },
                {
                    nested: { count: 2 },
                    values: ["b", "c"]
                }
            )
        ).toEqual({
            nested: { enabled: true, count: 2 },
            values: ["a", "b", "c"]
        });
    });
});
