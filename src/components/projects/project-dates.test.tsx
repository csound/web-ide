import { afterEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    within
} from "@testing-library/react";
import { ProjectDates } from "./project-dates";

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
});
it("shows only creation age until hovering the badge", async () => {
    const created = Date.UTC(2026, 9, 1, 12);
    const edited = Date.UTC(2026, 9, 3, 10);
    vi.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 9, 4, 12));
    const { container } = render(
        <ProjectDates project={{ created, lastModified: edited }} />
    );
    const badge = screen.getByRole("button", { name: /Created 3 days ago/ });
    expect(badge.textContent).toBe("3 days ago");
    expect(screen.queryByText(/Last edited/)).toBeNull();
    expect(container.querySelector("time")?.dateTime).toBe(
        new Date(created).toISOString()
    );
    fireEvent.mouseOver(badge);
    const tooltip = await screen.findByRole("tooltip");
    expect(within(tooltip).getByText(/Last edited/)).toBeDefined();
    expect(
        [...tooltip.querySelectorAll("time")].map((node) => node.dateTime)
    ).toEqual([
        new Date(created).toISOString(),
        new Date(edited).toISOString()
    ]);
});
it("keeps dates open after a touch tap until tapping outside", () => {
    vi.useFakeTimers();
    render(<ProjectDates project={{ cachedProjectLastModified: 123000 }} />);
    act(() => vi.advanceTimersByTime(1));
    const badge = screen.getByRole("button", {
        name: /creation date unknown/
    });
    fireEvent.touchStart(badge);
    fireEvent.touchEnd(badge);
    fireEvent.click(badge);
    expect(screen.getByRole("tooltip")).toBeDefined();
    act(() => vi.advanceTimersByTime(2000));
    act(() => vi.advanceTimersByTime(500));
    const tooltip = screen.getByRole("tooltip");
    expect(screen.getByText("Age unknown")).toBeDefined();
    expect(within(tooltip).getByText("Created: Unknown")).toBeDefined();
    expect(tooltip.querySelector("time")?.dateTime).toBe(
        new Date(123000).toISOString()
    );
    fireEvent.touchStart(document.body);
    fireEvent.touchEnd(document.body);
    fireEvent.click(document.body);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole("tooltip")).toBeNull();
});
it("reveals dates on keyboard focus", async () => {
    render(<ProjectDates project={{ created: 123000 }} />);
    act(() => screen.getByRole("button").focus());
    expect(await screen.findByRole("tooltip")).toBeDefined();
    expect(screen.getByText("Last edited: Unknown")).toBeDefined();
});
it("renders no badge when neither date is known", () => {
    const { container } = render(<ProjectDates project={{}} />);
    expect(container.textContent).toBe("");
    expect(screen.queryByRole("button")).toBeNull();
});
