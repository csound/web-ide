import { expect, it } from "vitest";
import { readTypes, typeRecords, validateTypes } from "./types";

it("keeps struct member types and dimensions and requires a complete registry snapshot", () => {
    const lines = [
        "@ide-type\t:Pair;\t0\t1",
        "@ide-member\t:Pair;\tvalues\ti\t2",
        "@ide-types-end"
    ];
    expect(readTypes(lines)).toEqual([
        {
            name: ":Pair;",
            argtype: 0,
            struct: true,
            members: [{ name: "values", type: "i", dimensions: 2 }]
        }
    ]);
    expect(() => readTypes(lines.slice(0, -1))).toThrow("Incomplete");
    expect(() => readTypes([lines[1], lines[2]])).toThrow();
    expect(() => readTypes([lines[0], lines[1], lines[1], lines[2]])).toThrow();
    expect(() =>
        readTypes([lines[0], lines[1].replace("\t2", "\t-1"), lines[2]])
    ).toThrow();
    expect(() =>
        validateTypes([
            { name: "bad\tname", argtype: 0, struct: false, members: [] }
        ])
    ).toThrow();
});

it("emits all type headers before members so forward references can resolve", () => {
    const stream = typeRecords([
        {
            name: "Parent",
            argtype: 0,
            struct: true,
            members: [{ name: "child", type: "Child", dimensions: 0 }]
        },
        { name: "Child", argtype: 0, struct: false, members: [] }
    ]);
    expect(stream.indexOf("T\tChild")).toBeLessThan(
        stream.indexOf("M\tParent")
    );
});
