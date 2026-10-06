import { expect, it } from "vitest";
import { visibleToolCount } from "./tool-overflow";

it("moves only complete buttons into More and reserves the trigger's width", () => {
    expect(visibleToolCount([80, 100, 120], 300, 70)).toBe(3);
    expect(visibleToolCount([80, 100, 120], 299, 70)).toBe(2);
    expect(visibleToolCount([80, 100, 120], 210, 70)).toBe(1);
    expect(visibleToolCount([80, 100, 120], 100, 70)).toBe(0);
});
