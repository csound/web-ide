import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});

it("shares a lazy index request and returns only local manual entries", async () => {
    const fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
            oscili: "opcodes/oscili/",
            outside: "https://example.com/",
            escape: "../editor/project"
        })
    });
    vi.stubGlobal("fetch", fetch);
    const { findManualEntry } = await import("./lookup");
    expect(fetch).not.toHaveBeenCalled();
    expect(
        await Promise.all([
            findManualEntry("oscili"),
            findManualEntry("missing")
        ])
    ).toEqual(["/manual/opcodes/oscili/", undefined]);
    expect(await findManualEntry("outside")).toBeUndefined();
    expect(await findManualEntry("escape")).toBeUndefined();
    expect(await findManualEntry("toString")).toBeUndefined();
    expect(fetch).toHaveBeenCalledExactlyOnceWith("/manual/lookup.json");
});

it("hides the link after an index failure and allows a later retry", async () => {
    const fetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ oscili: "opcodes/oscili/" })
        });
    vi.stubGlobal("fetch", fetch);
    const { findManualEntry } = await import("./lookup");
    expect(await findManualEntry("oscili")).toBeUndefined();
    expect(await findManualEntry("oscili")).toBe("/manual/opcodes/oscili/");
});
